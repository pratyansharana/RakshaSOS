import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import {app} from "./firebaseConfig";

const auth = getAuth(app);

/* SIGNUP */

export const signupUser = async (
  email: string,
  password: string
) => {
  const userCredential =
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

  return userCredential.user;
};

/* LOGIN */

export const loginUser = async (
  email: string,
  password: string
) => {
  const userCredential =
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  return userCredential.user;
};

export { auth };