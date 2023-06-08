// import { axios } from "axios"; // have problems with bundle.js
import { showAlert } from "./alerts";

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: "POST",
      url: "http://localhost:3001/api/v1/users/login",
      data: {
        email,
        password,
      },
    });

    if (res.data.status === "success") {
      showAlert("success", "Logged in Successfully");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "http://localhost:3001/api/v1/users/logout",
    });

    if (res.data.status === "success") {
      location.reload(true);
    }
  } catch (error) {
    showAlert("error", "Error logging out! Try Again.");
  }
};
