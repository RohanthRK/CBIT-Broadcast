import { Card, Container, Stack } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser, updateUser, followUser, unfollowUser } from "../../api/users";
import { isLoggedIn } from "../../helpers/authHelper";
import CommentBrowser from "../CommentBrowser";

import ErrorAlert from "../ErrorAlert";
import FindUsers from "../FindUsers";
import Footer from "../Footer";
import GoBack from "../GoBack";
import GridLayout from "../GridLayout";
import Loading from "../Loading";
import MobileProfile from "../MobileProfile";
import Navbar from "../Navbar";
import PostBrowser from "../PostBrowser";
import Profile from "../Profile";
import ProfileTabs from "../ProfileTabs";

const ProfileView = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState("posts");
  const user = isLoggedIn();
  const [error, setError] = useState("");
  const params = useParams();
  const navigate = useNavigate();

  const isOwnProfile =
    user && profile && user.username === profile.user.username;

  const fetchUser = async () => {
    setLoading(true);
    const data = await getUser(params, user && user.token);
    setLoading(false);
    if (data.error) {
      setError(data.error);
    } else {
      setProfile(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const content = e.target.content.value;

    await updateUser(user, { biography: content });

    setProfile({ ...profile, user: { ...profile.user, biography: content } });
    setEditing(false);
  };

  const handleEditing = () => {
    setEditing(!editing);
  };

  const handleMessage = () => {
    navigate("/messenger", { state: { user: profile.user } });
  };

  const handleFollow = async () => {
    if (!profile) return;
    const wasFollowing = profile.isFollowing;
    setProfile({
      ...profile,
      isFollowing: !wasFollowing,
      followerCount: profile.followerCount + (wasFollowing ? -1 : 1),
    });
    if (wasFollowing) {
      await unfollowUser(profile.user._id, user);
    } else {
      await followUser(profile.user._id, user);
    }
  };

  const handleProfileUpdate = (updatedFields) => {
    setProfile({
      ...profile,
      user: { ...profile.user, ...updatedFields },
    });
  };

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  const validate = (content) => {
    let error = "";

    if (content.length > 250) {
      error = "Bio cannot be longer than 250 characters";
    }

    return error;
  };

  let tabs;
  if (profile) {
    tabs = {
      posts: (
        <PostBrowser
          profileUser={profile.user}
          contentType="posts"
          key="posts"
        />
      ),
      liked: (
        <PostBrowser
          profileUser={profile.user}
          contentType="liked"
          key="liked"
        />
      ),
      comments: <CommentBrowser profileUser={profile.user} />,
      saved: isOwnProfile ? (
        <PostBrowser contentType="saved" key="saved" />
      ) : null,
    };
  }

  return (
    <Container>
      <Navbar />

      <GridLayout
        left={
          <>
            <MobileProfile
              profile={profile}
              editing={editing}
              handleSubmit={handleSubmit}
              handleEditing={handleEditing}
              handleMessage={handleMessage}
              handleFollow={handleFollow}
              validate={validate}
            />
            <Stack spacing={2}>
              {profile ? (
                <>
                  <ProfileTabs
                    tab={tab}
                    setTab={setTab}
                    isOwnProfile={isOwnProfile}
                  />

                  {tabs[tab]}
                </>
              ) : (
                <Loading />
              )}
              {error && <ErrorAlert error={error} />}
            </Stack>
          </>
        }
        right={
          <Stack spacing={2}>
            <Profile
              profile={profile}
              editing={editing}
              handleSubmit={handleSubmit}
              handleEditing={handleEditing}
              handleMessage={handleMessage}
              handleFollow={handleFollow}
              handleProfileUpdate={handleProfileUpdate}
              validate={validate}
            />

            <FindUsers />
            <Footer />
          </Stack>
        }
      />
    </Container>
  );
};

export default ProfileView;
