// ============================================================
// RakshaSOS — server.js (Firebase Cloud Functions)
// Schema: users, medical_profiles, emergency_contacts,
//         sos_alerts, live_tracking, emergency_timeline,
//         hospitals, police_stations
// ============================================================

const functions = require("firebase-functions/v1");
const { defineString } = require("firebase-functions/params");
const admin     = require("firebase-admin");
const twilio    = require("twilio");

admin.initializeApp();
const db = admin.firestore();


// ============================================================
// ENV PARAMS (Modern Firebase Config)
// ============================================================

const TWILIO_SID = defineString("TWILIO_SID");
const TWILIO_AUTH_TOKEN = defineString("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE = defineString("TWILIO_PHONE");

let twilioClient = null;
let TWILIO_NUMBER = null;

try {

  if (TWILIO_SID.value()) {

    twilioClient = twilio(
      TWILIO_SID.value(),
      TWILIO_AUTH_TOKEN.value()
    );

    TWILIO_NUMBER = TWILIO_PHONE.value();

    console.log("[TWILIO] Client initialized ✅");

  }

} catch (e) {

  console.warn("[TWILIO] Config not found — SMS disabled");
}
// ============================================================
// FEATURE 1 — SOS TRIGGERED
// Mobile app creates sos_alerts doc → function fires
// ============================================================

exports.onSOSTriggered = functions.firestore
  .document("sos_alerts/{sosId}")
  .onCreate(async (snap, context) => {
    const sos   = snap.data();
    const sosId = context.params.sosId;

    console.log(`[SOS] Triggered: ${sosId} | User: ${sos.user_id} | Type: ${sos.trigger_type} | SOS_type:${sos.SOS_type}`);

    try {

      // ── Step 1: Log timeline event ─────────────────────────
      await addTimelineEvent(sosId, "sos_triggered", {
        trigger_type: sos.trigger_type,
        lat: sos.last_known_lat,
        lng: sos.last_known_lng,
      });

      // ── Step 2: Fetch user + medical profile ───────────────
      const userSnap = await db.collection("users").doc(sos.user_id).get();
      if (!userSnap.exists) {
        console.error(`[SOS] User not found: ${sos.user_id}`);
        return;
      }
      const user = userSnap.data();

      const medSnap = await db
        .collection("users")
        .doc(sos.user_id)
        .collection("medical_profiles")
        .limit(1)
        .get();
      const medical = medSnap.empty ? {} : medSnap.docs[0].data();

      // ── Step 3: Route based on SOS_type ───────────────────
      const sosType = sos.SOS_type || "hospital"; // default: hospital

      let hospitalIds = [];
      let nearestPolice = null;

      if (sosType === "hospital" || sosType === "both") {
        const hospitalsSnap = await db.collection("hospitals").get();

        const RADIUS_KM = 10; // Only notify hospitals within 10km

        const allHospitals = hospitalsSnap.docs
          .map((doc) => {
            const h = doc.data();

            // Handle all possible field name formats
            const latVal = Number(h.latitude  || h.lat  || h.location?.latitude  || null);
            const lngVal = Number(h.longitude || h.lng  || h.location?.longitude || null);
            const sosLat = Number(sos.last_known_lat);
            const sosLng = Number(sos.last_known_lng);

            // Calculate distance only if coordinates exist and are valid numbers
            const distance = (!isNaN(latVal) && !isNaN(lngVal) && !isNaN(sosLat) && !isNaN(sosLng) && latVal && lngVal && sosLat && sosLng)
              ? getDistanceKm(sosLat, sosLng, latVal, lngVal)
              : 999999; // push hospitals with no coords to end

            return {
              hospitalId:       doc.id,
              hospitalName:     h.hospitalName || h.name || "Unknown Hospital",
              emergencyContact: h.emergencyContact || h.phone_number || h.phone || "",
              fullAddress:      h.fullAddress || h.address || h.location_text || "",
              available_beds:   Number(h.available_beds) || 0,
              emergencyBeds:    String(h.emergencyBeds || h.total_beds || "0"),
              city:             h.city || "",
              state:            h.state || "",
              email:            h.email || "",
              hospitalType:     h.hospitalType || "General",
              is_open_24_7:     Boolean(h.is_open_24_7),
              is_trauma_center: Boolean(h.is_trauma_center),
              createdAt:        h.createdAt || Date.now(),
              latitude:         latVal,
              longitude:        lngVal,
              distance:         distance
            };
          })
          .filter((h) => !!(h.hospitalName || h.name)) // Skip docs with no name at all
          .sort((a, b) => a.distance - b.distance);

        // Deduplicate by document ID only (in case of duplicate Firestore docs)
        const seenIds = new Set();
        const uniqueHospitals = allHospitals.filter((h) => {
          if (seenIds.has(h.hospitalId)) return false;
          seenIds.add(h.hospitalId);
          return true;
        });

        // Filter to hospitals within 10km radius, max 10
        let nearest10 = uniqueHospitals
          .filter((h) => h.distance <= RADIUS_KM)
          .slice(0, 10);

        // Fallback: if no hospital within radius, take the single closest one
        if (nearest10.length === 0 && uniqueHospitals.length > 0 && uniqueHospitals[0].distance < 999999) {
          console.warn(`[SOS] No hospitals within ${RADIUS_KM}km — falling back to nearest: ${uniqueHospitals[0].hospitalName} (${uniqueHospitals[0].distance.toFixed(2)}km)`);
          nearest10 = [uniqueHospitals[0]];
        }

        hospitalIds = nearest10.map((h) => h.hospitalId);
        console.log(`[SOS] ${hospitalIds.length} hospitals notified (within ${RADIUS_KM}km radius)`);
        nearest10.forEach((h) => {
          console.log(`  → ${h.hospitalName} | dist:${h.distance.toFixed(2)}km | coords:${h.latitude},${h.longitude}`);
        });
      }

      if (sosType === "police" || sosType === "both") {
        const policeSnap = await db.collection("policeStations").get();

        nearestPolice = policeSnap.docs
          .map((doc) => {
            const p = doc.data();
            const latVal = Number(p.latitude || p.lat || p.location?.latitude || null);
            const lngVal = Number(p.longitude || p.lng || p.location?.longitude || null);
            const sosLat = Number(sos.last_known_lat);
            const sosLng = Number(sos.last_known_lng);

            const distance = (!isNaN(latVal) && !isNaN(lngVal) && !isNaN(sosLat) && !isNaN(sosLng) && latVal && lngVal && sosLat && sosLng)
              ? getDistanceKm(sosLat, sosLng, latVal, lngVal)
              : 999999;

            return {
              id:       doc.id,
              name:     p.stationName || p.name || p.station_name || "Unknown Station",
              phone:    p.phone_number || p.phone || null,
              distance,
            };
          })
          .filter((p) => p.name !== "Unknown Station")
          .sort((a, b) => a.distance - b.distance)[0];

        console.log(`[SOS] Police station notified: ${nearestPolice?.name}`);
      }

      // ── Step 4: Update sos_alerts doc ─────────────────────
      // Compute victim age from dob
      let victimAge = null;
      if (user.dob) {
        try {
          const dob = new Date(user.dob);
          const now = new Date();
          victimAge = now.getFullYear() - dob.getFullYear();
          const m = now.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) victimAge--;
        } catch (_) { /* ignore parse errors */ }
      }

      await snap.ref.update({
        status:           "active",
        sos_type:         sosType,
        hospitals_notified: hospitalIds,
        police_station_id: nearestPolice?.id || null,
        victim_name:      user.full_name || null,
        victim_age:       victimAge,
        victim_gender:    user.gender || null,
        victim_phone:     user.phone_number || null,
        blood_group:      medical.blood_group || null,
        known_allergies:  medical.known_allergies || [],
        chronic_conditions: medical.chronic_conditions || null,
        emergency_doctor_name:  medical.emergency_doctor_name || null,
        emergency_doctor_phone: medical.emergency_doctor_phone || null,
        insurance_provider:     medical.insurance_provider || null,
        medical_notes:          medical.medical_notes || null,
        address_text:     sos.address_text || user.address || null,
        broadcasted_at:   admin.firestore.FieldValue.serverTimestamp(),
      });

      // ── Step 5: Notify web dashboards ─────────────────────
      if (hospitalIds.length > 0) {
        await notifyHospitalDashboards(sosId, sos, user, medical, nearest10);
      }
      if (nearestPolice) {
        await notifyPoliceDashboard(sosId, sos, user, nearestPolice);
      }

     // ── Step 6: Fetch emergency contacts from subcollection ──
      const contactsSnap = await db
        .collection("users")
        .doc(sos.user_id)
        .collection("emergency_contacts")
        .get();

      const contacts     = contactsSnap.docs.map((d) => d.data());
      const uniqueContacts = [];
      const seenPhones   = new Set();

      contacts.forEach((contact) => {
        // Handle both field name formats from mobile app
        const phone = contact.phone_number || contact.phone || contact.phoneNumber;
        if (!phone || seenPhones.has(phone)) return;
        seenPhones.add(phone);
        uniqueContacts.push({ ...contact, phone_number: phone });
      });

      console.log(`[SMS] Found ${uniqueContacts.length} emergency contacts`);

      const mapsLink = `https://maps.google.com/?q=${sos.last_known_lat},${sos.last_known_lng}`;
      const familyContacts = uniqueContacts.filter(isFamilyContact);

      // ── Step 7: Send SMS ──────────────────────────────────────
      if (twilioClient && uniqueContacts.length > 0) {
        const smsPromises = uniqueContacts.map((contact) => {
          const body =
            `🚨 EMERGENCY — ${user.full_name || "Someone"} ko madad chahiye!\n` +
            `Location: ${mapsLink}\n` +
            `Blood Group: ${medical.blood_group || "Unknown"}\n` +
            `Allergies: ${medical.known_allergies?.join(", ") || "None"}\n` +
            `— RakshaSOS`;

          console.log(`[SMS] Sending to ${contact.phone_number}`);
          return twilioClient.messages.create({
            to:   contact.phone_number,
            from: TWILIO_NUMBER,
            body,
          }).then(() => {
            console.log(`[SMS] ✅ Delivered to ${contact.phone_number}`);
          }).catch((err) => {
            console.error(`[SMS] ❌ Failed to ${contact.phone_number}: ${err.message}`);
          });
        });
        await Promise.all(smsPromises);
        console.log(`[SMS] Sent to ${uniqueContacts.length} contacts ✅`);

      } else if (!twilioClient) {
        console.log(`[SMS MOCK] Would send to: ${uniqueContacts.map(c => c.phone_number).join(", ")}`);
        uniqueContacts.forEach(c => {
          console.log(`[SMS MOCK] → ${c.phone_number}: 🚨 ${user.full_name} SOS | ${mapsLink}`);
        });
      } else {
        console.log(`[SMS] No emergency contacts found for user ${sos.user_id}`);
      }
      // ── Step 8: Log contacts_notified timeline ────────────
      await addTimelineEvent(sosId, "contacts_notified", {
        contacts_count: uniqueContacts.length,
        phones: uniqueContacts.map((c) => c.phone_number),
        family_contacts_count: familyContacts.length,
        family_phones: familyContacts.map((c) => c.phone_number),
      });

      if (familyContacts.length > 0) {
        await addTimelineEvent(sosId, "family_contacts_notified", {
          contacts_count: familyContacts.length,
          phones: familyContacts.map((c) => c.phone_number),
        });
      }

      // ── Step 9: Log police_notified timeline ──────────────
      if (nearestPolice) {
        await addTimelineEvent(sosId, "police_notified", {
          station_name: nearestPolice.name,
          station_id: nearestPolice.id,
          distance_km: nearestPolice.distance,
        });
      }

      // ── Step 10: Alert nearby bystanders (2km) ───────────
      await alertNearbyUsers(sosId, sos);

      console.log(`[SOS] ${sosId} fully processed ✅`);

    } catch (err) {
      console.error(`[SOS] Error:`, err);
    }
  });


// ============================================================
// FEATURE 2 — HOSPITAL ACCEPTS SOS
// Hospital dashboard updates sos_alerts → function fires
// ============================================================

exports.onSOSAccepted = functions.firestore
  .document("sos_alerts/{sosId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after  = change.after.data();
    const sosId  = context.params.sosId;

    // Only fire when accepted_by_hospital is newly set
    if (before.accepted_by_hospital === after.accepted_by_hospital) return null;
    if (!after.accepted_by_hospital) return null;
    if (after.status === "resolved" || after.status === "false_alarm") return null;
    if (!after.user_id) { console.error(`[ACCEPT] Missing user_id`); return null; }

    console.log(`[ACCEPT] ${sosId} accepted by ${after.accepted_by_name}`);

    try {

      let eta = after.ambulance_eta || 10;
      let distanceText = "Unknown";

      // Calculate location-wise ETA
      const hospitalSnap = await db.collection("hospitals").doc(after.accepted_by_hospital).get();
      if (hospitalSnap.exists) {
        const h = hospitalSnap.data();
        const hLat = Number(h.latitude || h.lat || h.location?.latitude || null);
        const hLng = Number(h.longitude || h.lng || h.location?.longitude || null);
        const sosLat = Number(after.last_known_lat);
        const sosLng = Number(after.last_known_lng);

        if (hLat && hLng && sosLat && sosLng) {
          const distanceKm = getDistanceKm(sosLat, sosLng, hLat, hLng);
          eta = Math.max(2, Math.ceil((distanceKm / 40) * 60));
          distanceText = `${distanceKm.toFixed(1)} km`;

          // If the newly calculated eta is different from the document's ambulance_eta, update it!
          if (after.ambulance_eta !== eta) {
            await change.after.ref.update({
              ambulance_eta: eta
            });
            after.ambulance_eta = eta; // update local value for subsequent code
          }
        }
      }

      // ── Merge incident log fields into the existing sos_alerts doc ──
      await db.collection("sos_alerts").doc(sosId).set({
        victimName:         after.victim_name || "Unknown",
        gender:             after.victim_gender || "N/A",
        age:                after.victim_age || "N/A",
        bloodGroup:         after.blood_group || "N/A",
        condition:          after.chronic_conditions || after.condition || "N/A",
        pulse:              after.pulse || "N/A",
        type:               after.sos_type || "Emergency",
        severity:           after.severity || "Critical",
        imageUrl:           after.image_url || null,
        voiceNoteUrl:       after.voice_note_url || after.audio_recording_url || null,
        address:            after.address_text || "N/A",
        latitude:           after.last_known_lat || 0,
        longitude:          after.last_known_lng || 0,
        acceptedHospitalId: after.accepted_by_hospital,
        incidentStatus:     "active",
        ambulanceStatus:    "waiting",
        ambulanceAssigned:  false,
        estimatedArrivalMinutes: eta,
        distanceText:       distanceText,
        createdAt:          admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // ── Log ambulance_dispatched timeline ─────────────────
      await addTimelineEvent(sosId, "ambulance_dispatched", {
        hospital_name: after.accepted_by_name,
        hospital_id:   after.accepted_by_hospital,
        eta_minutes:   after.ambulance_eta,
      });

      // ── FCM to victim ──────────────────────────────────────
      const userSnap = await db.collection("users").doc(after.user_id).get();
      const fcmToken = userSnap.data()?.fcm_token;

      if (fcmToken) {
        if (fcmToken.startsWith("dummy_")) {
          console.log(`[FCM MOCK] Would notify victim about acceptance`);
        } else {
          try {
            await admin.messaging().send({
              token: fcmToken,
              notification: {
                title: "Help is on the way! 🚑",
                body: `${after.accepted_by_name} accepted your SOS. ETA: ~${after.ambulance_eta} min.`,
              },
              data: {
                type: "sos_accepted",
                sos_id: sosId,
                hospital_name: after.accepted_by_name,
                eta: String(after.ambulance_eta),
              },
              android: { priority: "high" },
            });
            console.log(`[FCM] Victim notified ✅`);
          } catch (err) {
            console.log(`[FCM] Error:`, err.message);
          }
        }
      }


      // ── SMS acknowledgement to victim ─────────────────────────
      const userPhone = userSnap.data()?.phone_number;

      if (userPhone) {
        if (!twilioClient) {
          console.log(`[SMS MOCK] Acknowledgement to ${userPhone}:`);
          console.log(`  ✅ ${after.accepted_by_name} accepted your SOS`);
          console.log(`  ETA: ~${after.ambulance_eta} minutes`);
        } else {
          await twilioClient.messages.create({
            to: userPhone,
            from: TWILIO_NUMBER,
            body:
              `✅ RakshaSOS — Help is on the way!\n` +
              `Hospital: ${after.accepted_by_name}\n` +
              `Ambulance ETA: ~${after.ambulance_eta} minutes\n` +
              `Stay calm. Do not move if injured.\n` +
              `— RakshaSOS Emergency`,
          }).catch((err) => console.error(`[SMS] Failed:`, err.message));
        }
      }

      // ── FCM to remaining 9 hospitals (case locked) ─────────
      const otherIds = (after.hospitals_notified || [])
        .filter((id) => id !== after.accepted_by_hospital)
        .slice(0, 10);

      if (otherIds.length > 0) {
        const staffSnap = await db.collection("hospital_staff")
          .where("hospital_id", "in", otherIds)
          .get();

        const tokens = staffSnap.docs
          .map((d) => d.data().fcm_token)
          .filter(Boolean);

        if (tokens.length > 0) {
          await admin.messaging().sendEachForMulticast({
            tokens,
            notification: {
              title: "SOS Already Accepted",
              body:  `Case accepted by ${after.accepted_by_name}. No action needed.`,
            },
            data: {
              type:        "sos_locked",
              sos_id:      sosId,
              accepted_by: after.accepted_by_name,
            },
          });
        }
      }

      // ── FCM to police dashboard ────────────────────────────
      if (after.police_station_id) {
        const policeStaffSnap = await db.collection("police_staff")
          .where("station_id", "==", after.police_station_id)
          .get();

        const policeTokens = policeStaffSnap.docs
          .map((d) => d.data().fcm_token)
          .filter(Boolean);

        if (policeTokens.length > 0) {
          await admin.messaging().sendEachForMulticast({
            tokens: policeTokens,
            notification: {
              title: "🚨 New SOS Alert",
              body:  `Accident reported near your jurisdiction. Hospital: ${after.accepted_by_name}`,
            },
            data: {
              type:   "new_sos_police",
              sos_id: sosId,
              lat:    String(after.last_known_lat),
              lng:    String(after.last_known_lng),
            },
          });
        }
      }

    } catch (err) {
      console.error(`[ACCEPT] Error:`, err);
    }

    return null;
  });


// ============================================================
// FEATURE 3 — OFFLINE SOS (Twilio SMS Webhook)
// Victim has no internet → sends SMS → Twilio hits this
// ============================================================

exports.offlineSOSWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const { From, Body } = req.body;
    console.log(`[OFFLINE SOS] SMS from ${From}: ${Body}`);

    // Expected format: "SOS 23.2599 77.4126"
    const parts = Body.trim().split(" ");
    if (parts[0].toUpperCase() !== "SOS" || parts.length < 3) {
      return res.status(400).send("Invalid format. Send: SOS LAT LNG");
    }

    const lat = parseFloat(parts[1]);
    const lng = parseFloat(parts[2]);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).send("Invalid coordinates");
    }

    // Find user by phone
    const userSnap = await db.collection("users")
      .where("phone_number", "==", From)
      .limit(1)
      .get();

    if (userSnap.empty) {
      console.warn(`[OFFLINE SOS] User not found: ${From}`);
      return res.status(404).send("User not found");
    }

    const userDoc  = userSnap.docs[0];
    const user     = userDoc.data();

    // Create sos_alerts doc → onSOSTriggered fires automatically
    await db.collection("sos_alerts").add({
      user_id:         userDoc.id,
      status:          "triggered",
      trigger_type:    "offline_sms",
      last_known_lat:  lat,
      last_known_lng:  lng,
      audio_recording_url: null,
      is_offline_sos:  true,
      hospitals_notified: [],
      accepted_by_hospital: null,
      accepted_by_name: null,
      ambulance_eta:   null,
      start_time:      new Date(),
      end_time:        null,
    });

    console.log(`[OFFLINE SOS] Created for ${user.full_name}`);
    res.status(200).send("<Response></Response>"); // Twilio expects XML

  } catch (err) {
    console.error(`[OFFLINE SOS] Error:`, err);
    res.status(500).send("Internal error");
  }
});


// ============================================================
// FEATURE 4 — LIVE TRACKING + ETA UPDATE
// Ambulance/victim location update every 30s
// ============================================================

exports.updateLiveTracking = functions.https.onCall(async (data, context) => {
  const { sos_id, latitude, longitude, battery_level, is_ambulance, ambulance_lat, ambulance_lng } = data;

  try {
    // ── Save to live_tracking collection ──────────────────────
    await db.collection("live_tracking").add({
      sos_id,
      latitude,
      longitude,
      battery_level: battery_level || null,
      timestamp: new Date(),
    });

    // ── Update last known location in sos_alerts ──────────────
    await db.collection("sos_alerts").doc(sos_id).update({
      last_known_lat: latitude,
      last_known_lng: longitude,
    });

    // ── If ambulance location sent → recalculate ETA ──────────
    if (is_ambulance && ambulance_lat && ambulance_lng) {
      const sosSnap = await db.collection("sos_alerts").doc(sos_id).get();
      const sos     = sosSnap.data();

      const distanceKm = getDistanceKm(
        ambulance_lat, ambulance_lng, latitude, longitude
      );

      // Avg city speed 40 km/h
      const etaMinutes = Math.ceil((distanceKm / 40) * 60);

      await sosSnap.ref.update({
        ambulance_eta:     etaMinutes,
        ambulance_lat,
        ambulance_lng,
        eta_updated_at:    new Date(),
      });

      // FCM to victim with updated ETA
      const userSnap = await db.collection("users").doc(sos.user_id).get();
      const fcmToken = userSnap.data()?.fcm_token;

      if (fcmToken) {
          if (fcmToken.startsWith("dummy_")) {
            console.log(`[FCM MOCK] Would send ETA update: ${etaMinutes} min`);
          } else {
            try {
              await admin.messaging().send({
                token: fcmToken,
                data: {
                  type: "eta_update",
                  sos_id,
                  eta_minutes: String(etaMinutes),
                  message: `Ambulance arriving in ${etaMinutes} min — ${sos.accepted_by_name}`,
                },
                android: { priority: "high" },
              });
              console.log(`[FCM] ETA sent ✅`);
            } catch (err) {
              console.log(`[FCM] Error:`, err.message);
            }
          }
        }

      console.log(`[ETA] ${sos_id} → ${etaMinutes} min`);
      return { success: true, eta_minutes: etaMinutes };
    }

    return { success: true };

  } catch (err) {
    console.error(`[TRACKING] Error:`, err);
    throw new functions.https.HttpsError("internal", err.message);
  }
});


// ============================================================
// FEATURE 5 — SOS RESOLVED
// Hospital/user marks SOS resolved
// ============================================================

exports.onSOSResolved = functions.firestore
  .document("sos_alerts/{sosId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after  = change.after.data();
    const sosId  = context.params.sosId;

    if (before.status === after.status) return null;
    if (after.status !== "resolved" && after.status !== "false_alarm") return null;

    console.log(`[RESOLVED] ${sosId} → ${after.status}`);

    try {

      // ── Mark sos_alerts doc as completed ─────────────────────────
      await db.collection("sos_alerts").doc(sosId).update({
        incidentStatus: "completed",
        completedAt: Date.now(),
      }).catch((err) => console.warn(`[RESOLVED] sos_alerts doc not found:`, err.message));

      // ── Log resolved timeline ──────────────────────────────
      await addTimelineEvent(sosId, "resolved", {
        status:      after.status,
        resolved_by: after.resolved_by || "unknown",
      });

      // ── FCM to victim ──────────────────────────────────────
      const userSnap = await db.collection("users").doc(after.user_id).get();
      const fcmToken = userSnap.data()?.fcm_token;

      if (fcmToken) {
        if (fcmToken.startsWith("dummy_")) {
          console.log(`[FCM MOCK] Would notify victim: case ${after.status}`);
        } else {
          try {
            await admin.messaging().send({
              token: fcmToken,
              notification: {
                title: after.status === "resolved" ? "Case Resolved ✅" : "False Alarm Marked",
                body: after.status === "resolved"
                  ? "Your SOS case has been resolved. Stay safe!"
                  : "SOS marked as false alarm.",
              },
              data: { type: "sos_resolved", sos_id: sosId, status: after.status },
            });
            console.log(`[FCM] Resolution notified ✅`);
          } catch (err) {
            console.log(`[FCM] Error:`, err.message);
          }
        }
      }

    } catch (err) {
      console.error(`[RESOLVED] Error:`, err);
    }

    return null;
  });


  // ============================================================
// FEATURE — HOSPITAL ACCEPTS FROM DASHBOARD
// Hospital dashboard updates hospital_notifications doc
// ============================================================

exports.onHospitalAccept = functions.firestore
  .document("hospital_notifications/{notifId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after  = change.after.data();

    if (before.status === after.status) return null;
    if (after.status !== "accepted") return null;

    const sosId = after.sos_id;
    console.log(`[ACCEPT] Hospital ${after.hospital_name} accepted SOS ${sosId}`);

    try {
      // ── Update sos_alerts doc ──────────────────────────────
      await db.collection("sos_alerts").doc(sosId).update({
        accepted_by_hospital: after.hospital_id,
        accepted_by_name:     after.hospital_name,
        ambulance_eta:        after.ambulance_eta || 10,
        status:               "accepted",
        accepted_at:          admin.firestore.FieldValue.serverTimestamp(),
      });

      // ── Mark other hospital notifications as locked ────────
      const otherNotifs = await db.collection("hospital_notifications")
        .where("sos_id", "==", sosId)
        .where("status", "==", "pending")
        .get();

      const batch = db.batch();
      otherNotifs.docs.forEach((doc) => {
        if (doc.id !== context.params.notifId) {
          batch.update(doc.ref, {
            status:      "locked",
            accepted_by: after.hospital_name,
            locked_at:   admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      });
      await batch.commit();

      console.log(`[ACCEPT] ${otherNotifs.size - 1} other hospitals locked ✅`);

      // ── Timeline ───────────────────────────────────────────
      await addTimelineEvent(sosId, "ambulance_dispatched", {
        hospital_name: after.hospital_name,
        hospital_id:   after.hospital_id,
        eta_minutes:   after.ambulance_eta || 10,
      });

      // ── SMS to victim ──────────────────────────────────────
      if (twilioClient) {
        const userSnap = await db.collection("users").doc(after.victim_id || "").get();
        const phone    = userSnap.data()?.phone_number;
        if (phone) {
          await twilioClient.messages.create({
            to:   phone,
            from: TWILIO_NUMBER,
            body: `✅ RakshaSOS — Help is on the way!\nHospital: ${after.hospital_name}\nETA: ~${after.ambulance_eta || 10} min\nStay calm.\n— RakshaSOS`,
          }).catch((err) => console.error("[SMS] Failed:", err.message));
        }
      }

    } catch (err) {
      console.error("[ACCEPT] Error:", err);
    }

    return null;
  });

// ============================================================
// TEST FUNCTION — SEND REAL TWILIO SMS
// ============================================================

exports.testSMS = functions.https.onRequest(async (req, res) => {

  try {

    const client = twilio(
      TWILIO_SID.value(),
      TWILIO_AUTH_TOKEN.value()
    );

    const result = await client.messages.create({
      to: "+917770844739", // your verified number
      from: TWILIO_PHONE.value(),
      body: "RakshaSOS test SMS ✅",
    });

    console.log("[TEST SMS] Sent:", result.sid);

    res.send({
      success: true,
      sid: result.sid,
    });

  } catch (err) {

    console.error("[TEST SMS ERROR]", err);

    res.status(500).send({
      success: false,
      error: err.message,
    });

  }

});


// ============================================================
// HELPER — Build SOS SMS body
// ============================================================

function isFamilyContact(contact) {
  if (!contact) return false;
  const relationship = String(contact.relationship || contact.relation || "").toLowerCase();
  const familyKeys = [
    "family", "father", "mother", "parent", "guardian",
    "spouse", "husband", "wife", "brother", "sister",
    "son", "daughter",
  ];
  return contact.is_family_contact === true || familyKeys.includes(relationship);
}

function buildSosSmsBody(user, medical, mapsLink, contact) {
  const lines = [
    `🚨 EMERGENCY — ${user.full_name} ne SOS trigger kiya!`,
    `Location: ${mapsLink}`,
    `Blood Group: ${medical.blood_group || "Unknown"}`,
    `Allergies: ${medical.known_allergies?.join(", ") || "None"}`,
  ];

  if (isFamilyContact(contact)) {
    lines.push("Family alert: Please share this with close relatives immediately.");
  }

  lines.push("— RakshaSOS");
  return lines.join("\n");
}

// ============================================================
// HELPER — Alert nearby users within 2km
// ============================================================

async function alertNearbyUsers(sosId, sos) {
  try {
    const usersSnap = await db.collection("users")
      .where("is_verified", "==", true)
      .get();

    const nearbyTokens  = [];
    const nearbyUserIds = [];

    usersSnap.docs.forEach((doc) => {
      if (doc.id === sos.user_id) return;

      const user = doc.data();
      if (!user.fcm_token || !user.last_known_lat) return;

      const distance = getDistanceKm(
        sos.last_known_lat, sos.last_known_lng,
        user.last_known_lat, user.last_known_lng
      );

      if (distance <= 2) {
        nearbyTokens.push(user.fcm_token);
        nearbyUserIds.push(doc.id);
      }
    });

    if (nearbyTokens.length === 0) return;

    await admin.messaging().sendEachForMulticast({
      tokens: nearbyTokens,
      notification: {
        title: "Accident Nearby 🚨",
        body:  "Someone needs help near you. Can you assist?",
      },
      data: {
        type:         "bystander_alert",
        sos_id:       sosId,
        latitude:     String(sos.last_known_lat),
        longitude:    String(sos.last_known_lng),
        address_text: sos.address_text || "",
      },
      android: { priority: "high" },
    });

    await db.collection("sos_alerts").doc(sosId).update({
      nearby_users_notified: nearbyUserIds,
    });

    console.log(`[BYSTANDER] Alerted ${nearbyTokens.length} nearby users`);

  } catch (err) {
    console.error("[BYSTANDER] Error:", err);
  }
}


// ============================================================
// HELPER — Add emergency_timeline event
// ============================================================

async function addTimelineEvent(sosId, eventType, details = {}) {
  try {
    await db.collection("emergency_timeline").add({
      sos_id:        sosId,
      event_type:    eventType,
      event_details: details,
      timestamp:     admin.firestore.FieldValue.serverTimestamp(), // keep only this
    });
    console.log(`[TIMELINE] ${eventType} logged for ${sosId}`);
  } catch (err) {
    console.error(`[TIMELINE] Error:`, err);
  }
}

// ============================================================
// UTILITY — Haversine distance (km)
// ============================================================

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R    = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a    =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// ============================================================
// HELPER — Notify Hospital Dashboards
// Called inside onSOSTriggered after hospitalIds are found
// ============================================================

async function notifyHospitalDashboards(sosId, sos, user, medical, nearest10) {
  try {
    const batch = db.batch();

    // Compute victim age from dob
    let victimAge = null;
    if (user.dob) {
      try {
        const dob = new Date(user.dob);
        const now = new Date();
        victimAge = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) victimAge--;
      } catch (_) { /* ignore parse errors */ }
    }

    nearest10.forEach((hospital) => {
      // Create a notification doc for each hospital dashboard
      const notifRef = db.collection("hospital_notifications").doc();
      batch.set(notifRef, {
        sos_id:          sosId,
        hospital_id:     hospital.hospitalId,
        hospital_name:   hospital.hospitalName || hospital.name,
        status:          "pending",           // hospital dashboard shows Accept button
        victim_name:     user.full_name || "Unknown",
        victim_age:      victimAge,
        victim_gender:   user.gender || null,
        victim_phone:    user.phone_number || null,
        blood_group:     medical.blood_group || null,
        known_allergies: medical.known_allergies || [],
        chronic_conditions: medical.chronic_conditions || null,
        emergency_doctor_name:  medical.emergency_doctor_name || null,
        emergency_doctor_phone: medical.emergency_doctor_phone || null,
        medical_notes:          medical.medical_notes || null,
        last_known_lat:  sos.last_known_lat,
        last_known_lng:  sos.last_known_lng,
        address_text:    sos.address_text || user.address || null,
        sos_type:        sos.SOS_type || "hospital",
        trigger_type:    sos.trigger_type,
        distance_km:     hospital.distance,
        created_at:      admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    console.log(`[DASHBOARD] ${nearest10.length} hospital notifications created ✅`);
  } catch (err) {
    console.error("[DASHBOARD] Hospital notify error:", err);
  }
}


// ============================================================
// HELPER — Notify Police Dashboard
// Called inside onSOSTriggered when sosType is police/both
// ============================================================

async function notifyPoliceDashboard(sosId, sos, user, nearestPolice) {
  try {
    await db.collection("police_notifications").add({
      sos_id:         sosId,
      station_id:     nearestPolice.id,
      station_name:   nearestPolice.name,
      status:         "pending",              // police dashboard shows Dispatch button
      victim_name:    user.full_name || "Unknown",
      last_known_lat: sos.last_known_lat,
      last_known_lng: sos.last_known_lng,
      address_text:   sos.address_text || null,
      sos_type:       sos.SOS_type || "police",
      trigger_type:   sos.trigger_type,
      distance_km:    nearestPolice.distance,
      created_at:     admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`[DASHBOARD] Police notification created for ${nearestPolice.name} ✅`);
  } catch (err) {
    console.error("[DASHBOARD] Police notify error:", err);
  }
}