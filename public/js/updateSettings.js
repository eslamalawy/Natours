import { showAlert } from "./alerts";

// type is either 'password' , or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === "password"
        ? "http://localhost:3001/api/v1/users/updateMyPassword"
        : "http://localhost:3001/api/v1/users/updateMe";
    const res = await axios({
      method: "PATCH",
      url,
      data,
    });

    if (res.data.status === "success") {
      showAlert("success", ` ${type.toUpperCase()} Updated Successfully!`);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
