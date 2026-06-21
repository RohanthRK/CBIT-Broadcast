import { BASE_URL } from "../config";

const signup = async (user) => {
  try {
    const isFormData = user instanceof FormData;
    const headers = {};
    if (!isFormData) {
      headers["Accept"] = "application/json";
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(BASE_URL + "api/users/register", {
      method: "POST",
      headers,
      body: isFormData ? user : JSON.stringify(user),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

const login = async (user) => {
  try {
    const res = await fetch(BASE_URL + "api/users/login", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

const getUser = async (params, token) => {
  try {
    const res = await fetch(BASE_URL + "api/users/" + params.id, {
      headers: {
        "x-access-token": token || "",
      },
    });
    return res.json();
  } catch (err) {
    console.log(err);
  }
};

const getRandomUsers = async (query) => {
  try {
    const res = await fetch(
      BASE_URL + "api/users/random?" + new URLSearchParams(query)
    );
    return res.json();
  } catch (err) {
    console.log(err);
  }
};

const getUsersByDepartment = async (department, token) => {
  try {
    const query = department && department !== "All" ? { department } : {};
    const res = await fetch(
      BASE_URL + "api/users?" + new URLSearchParams(query),
      {
        headers: {
          "x-access-token": token || "",
        },
      }
    );
    return res.json();
  } catch (err) {
    console.log(err);
  }
};

const updateUser = async (user, data) => {
  try {
    const res = await fetch(BASE_URL + "api/users/" + user.userId, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-access-token": user.token,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (err) {
    console.log(err);
  }
};

const followUser = async (userId, user) => {
  try {
    const res = await fetch(BASE_URL + "api/users/follow/" + userId, {
      method: "POST",
      headers: {
        "x-access-token": user.token,
      },
    });
    return res.json();
  } catch (err) {
    console.log(err);
  }
};

const unfollowUser = async (userId, user) => {
  try {
    const res = await fetch(BASE_URL + "api/users/unfollow/" + userId, {
      method: "DELETE",
      headers: {
        "x-access-token": user.token,
      },
    });
    return res.json();
  } catch (err) {
    console.log(err);
  }
};

export {
  signup,
  login,
  getUser,
  getRandomUsers,
  getUsersByDepartment,
  updateUser,
  followUser,
  unfollowUser,
};
