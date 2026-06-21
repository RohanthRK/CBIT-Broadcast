import { BASE_URL } from "../config";

const getEvents = async (token, query) => {
  try {
    const res = await fetch(
      BASE_URL + "api/events?" + new URLSearchParams(query),
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

const createEvent = async (event, user) => {
  try {
    const isFormData = event instanceof FormData;
    const headers = {
      "x-access-token": user.token,
    };
    if (!isFormData) {
      headers["Accept"] = "application/json";
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(BASE_URL + "api/events", {
      method: "POST",
      headers,
      body: isFormData ? event : JSON.stringify(event),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

const rsvpEvent = async (eventId, status, user) => {
  try {
    const res = await fetch(BASE_URL + "api/events/rsvp/" + eventId, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-access-token": user.token,
      },
      body: JSON.stringify({ status, userId: user.userId }),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

const deleteEvent = async (eventId, user) => {
  try {
    const res = await fetch(BASE_URL + "api/events/" + eventId, {
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

const updateEvent = async (eventId, event, user) => {
  try {
    const isFormData = event instanceof FormData;
    const headers = {
      "x-access-token": user.token,
    };
    if (!isFormData) {
      headers["Accept"] = "application/json";
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(BASE_URL + "api/events/" + eventId, {
      method: "PATCH",
      headers,
      body: isFormData ? event : JSON.stringify(event),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

export {
  getEvents,
  createEvent,
  rsvpEvent,
  updateEvent,
  deleteEvent,
};
