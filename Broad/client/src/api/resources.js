import { BASE_URL } from "../config";

const getResources = async (token, query) => {
  try {
    const res = await fetch(
      BASE_URL + "api/resources?" + new URLSearchParams(query),
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

const createResource = async (resource, user) => {
  try {
    const isFormData = resource instanceof FormData;
    const headers = {
      "x-access-token": user.token,
    };
    if (!isFormData) {
      headers["Accept"] = "application/json";
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(BASE_URL + "api/resources", {
      method: "POST",
      headers,
      body: isFormData ? resource : JSON.stringify(resource),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

const upvoteResource = async (resourceId, user) => {
  try {
    const res = await fetch(BASE_URL + "api/resources/upvote/" + resourceId, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-access-token": user.token,
      },
      body: JSON.stringify({ userId: user.userId }),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

const deleteResource = async (resourceId, user) => {
  try {
    const res = await fetch(BASE_URL + "api/resources/" + resourceId, {
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

const updateResource = async (resourceId, resource, user) => {
  try {
    const isFormData = resource instanceof FormData;
    const headers = {
      "x-access-token": user.token,
    };
    if (!isFormData) {
      headers["Accept"] = "application/json";
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(BASE_URL + "api/resources/" + resourceId, {
      method: "PATCH",
      headers,
      body: isFormData ? resource : JSON.stringify(resource),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

export {
  getResources,
  createResource,
  upvoteResource,
  updateResource,
  deleteResource,
};
