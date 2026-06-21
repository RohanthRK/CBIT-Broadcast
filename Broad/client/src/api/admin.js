import { BASE_URL } from "../config";

const getReports = async (user) => {
  try {
    const res = await fetch(BASE_URL + "api/admin/reports", {
      headers: {
        "x-access-token": user.token,
      },
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

const createReport = async (postId, reason, user) => {
  try {
    const res = await fetch(BASE_URL + "api/admin/reports", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-access-token": user.token,
      },
      body: JSON.stringify({ postId, reason }),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

const resolveReport = async (reportId, action, user) => {
  try {
    const res = await fetch(BASE_URL + "api/admin/reports/" + reportId, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-access-token": user.token,
      },
      body: JSON.stringify({ action }),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

const getPendingVerifications = async (user) => {
  try {
    const res = await fetch(BASE_URL + "api/admin/verifications", {
      headers: {
        "x-access-token": user.token,
      },
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

const resolveVerification = async (userId, action, user) => {
  try {
    const res = await fetch(BASE_URL + "api/admin/verifications/" + userId, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-access-token": user.token,
      },
      body: JSON.stringify({ action }),
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

export { 
  getReports, 
  createReport, 
  resolveReport, 
  getPendingVerifications, 
  resolveVerification 
};
