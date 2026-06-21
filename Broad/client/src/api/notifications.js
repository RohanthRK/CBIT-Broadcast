import { BASE_URL } from "../config";

const getNotifications = async (user) => {
  try {
    const res = await fetch(BASE_URL + "api/notifications", {
      headers: {
        "x-access-token": user.token,
      },
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

const markNotificationsRead = async (user) => {
  try {
    const res = await fetch(BASE_URL + "api/notifications/read", {
      method: "PATCH",
      headers: {
        "x-access-token": user.token,
      },
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

export { getNotifications, markNotificationsRead };
