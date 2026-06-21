import { BASE_URL } from "../config";

const getLostFoundItems = async (token, query) => {
  try {
    const res = await fetch(
      BASE_URL + "api/lost-found?" + new URLSearchParams(query),
      {
        headers: {
          "x-access-token": token,
        },
      }
    );
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

const createLostFoundItem = async (item, user) => {
  try {
    const isFormData = item instanceof FormData;
    const headers = {
      "x-access-token": user.token,
    };
    if (!isFormData) {
      headers["Accept"] = "application/json";
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(BASE_URL + "api/lost-found", {
      method: "POST",
      headers,
      body: isFormData ? item : JSON.stringify(item),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

const updateLostFoundItem = async (itemId, item, user) => {
  try {
    const isFormData = item instanceof FormData;
    const headers = {
      "x-access-token": user.token,
    };
    if (!isFormData) {
      headers["Accept"] = "application/json";
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(BASE_URL + "api/lost-found/" + itemId, {
      method: "PATCH",
      headers,
      body: isFormData ? item : JSON.stringify(item),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

const deleteLostFoundItem = async (itemId, user) => {
  try {
    const res = await fetch(BASE_URL + "api/lost-found/" + itemId, {
      method: "DELETE",
      headers: {
        "x-access-token": user.token,
      },
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

export {
  getLostFoundItems,
  createLostFoundItem,
  updateLostFoundItem,
  deleteLostFoundItem,
};
