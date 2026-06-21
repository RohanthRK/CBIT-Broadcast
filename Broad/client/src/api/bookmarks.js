import { BASE_URL } from "../config";

const bookmarkPost = async (postId, user) => {
  try {
    const res = await fetch(BASE_URL + "api/bookmarks/" + postId, {
      method: "POST",
      headers: {
        "x-access-token": user.token,
      },
    });
    return await res.json();
  } catch (err) {
    console.log(err);
  }
};

const unbookmarkPost = async (postId, user) => {
  try {
    const res = await fetch(BASE_URL + "api/bookmarks/" + postId, {
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

const getBookmarkedPosts = async (token, query) => {
  try {
    if (!token) return { data: [], count: 0 };
    const res = await fetch(
      BASE_URL + "api/bookmarks?" + new URLSearchParams(query),
      {
        headers: {
          "x-access-token": token,
        },
      }
    );
    return await res.json();
  } catch (err) {
    console.log(err);
    return { error: err.message };
  }
};

export { bookmarkPost, unbookmarkPost, getBookmarkedPosts };
