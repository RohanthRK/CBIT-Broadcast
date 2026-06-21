import {
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect, useRef, useState } from "react";
import { AiFillCaretLeft, AiFillMessage } from "react-icons/ai";
import { Link } from "react-router-dom";
import { getMessages, sendMessage } from "../api/messages";
import { isLoggedIn } from "../helpers/authHelper";
import { socket } from "../helpers/socketHelper";
import Loading from "./Loading";
import Message from "./Message";
import SendMessage from "./SendMessage";
import UserAvatar from "./UserAvatar";
import HorizontalStack from "./util/HorizontalStack";

const Messages = (props) => {
  const messagesEndRef = useRef(null);
  const user = isLoggedIn();
  const [messages, setMessages] = useState(null);
  const [loading, setLoading] = useState(true);

  const conversationsRef = useRef(props.conversations);
  const conservantRef = useRef(props.conservant);
  const messagesRef = useRef(messages);
  useEffect(() => {
    conversationsRef.current = props.conversations;
    conservantRef.current = props.conservant;
    messagesRef.current = messages;
  });

  const conversation =
    props.conversations &&
    props.conservant &&
    props.getConversation(props.conversations, props.conservant._id);

  const setDirection = (messages) => {
    messages.forEach((message) => {
      if (message.sender._id === user.userId) {
        message.direction = "from";
      } else {
        message.direction = "to";
      }
    });
  };

  const fetchMessages = async () => {
    if (conversation) {
      setLoading(true);

      const data = await getMessages(user, conversation._id);

      setDirection(data);

      if (data && !data.error) {
        setMessages(data);

        // Mark conversation as read locally and resolve conversation ID if it was a user ID
        const updatedConversations = props.conversations.map((c) => {
          if (c._id === conversation._id) {
            let actualId = c._id;
            let isNew = c.new;
            if (data.length > 0) {
              actualId = data[0].conversation;
              isNew = false;
            }
            return {
              ...c,
              _id: actualId,
              new: isNew,
              unreadCount: 0,
            };
          }
          return c;
        });
        props.setConversations(updatedConversations);

        // Notify Navbar
        window.dispatchEvent(new Event("messages-read"));
      }

      setLoading(false);
    }
  };

  useEffect(() => {
    setMessages(null);
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.conservant]);

  useEffect(() => {
    if (props.conservant && !messages && props.conversations && props.conversations.length > 0) {
      fetchMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.conversations]);

  useEffect(() => {
    if (messages) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  };

  const handleSendMessage = async (content) => {
    const newMessage = { direction: "from", content };
    const newMessages = [newMessage, ...messages];

    if (conversation.new) {
      conversation.messages = [...conversation.messages, newMessage];
    }

    let newConversations = props.conversations.filter(
      (conversationCompare) => conversation._id !== conversationCompare._id
    );

    newConversations.unshift(conversation);

    props.setConversations(newConversations);

    setMessages(newMessages);

    const res = await sendMessage(user, newMessage, conversation.recipient._id);

    if (res && res.conversationId) {
      // Update conversation in the state with the actual ID
      const updatedConversations = newConversations.map((c) => {
        if (c._id === conversation._id) {
          return {
            ...c,
            _id: res.conversationId,
            new: false,
          };
        }
        return c;
      });
      props.setConversations(updatedConversations);
      
      // Update the local conversation object ID so that subsequent operations in this closure use the real ID
      conversation._id = res.conversationId;
      conversation.new = false;
    }

    socket.emit(
      "send-message",
      conversation.recipient._id,
      user.username,
      content
    );
  };

  const handleReceiveMessage = async (senderId, username, content) => {
    const newMessage = { direction: "to", content };

    const conversation = props.getConversation(
      conversationsRef.current,
      senderId
    );

    const isActive = conservantRef.current && conservantRef.current._id === senderId;

    console.log(username + " " + content);

    if (conversation) {
      let newMessages = [newMessage];
      if (messagesRef.current && isActive) {
        newMessages = [...newMessages, ...messagesRef.current];
      }

      if (isActive) {
        setMessages(newMessages);
      }

      if (conversation.new) {
        conversation.messages = newMessages;
      }
      conversation.lastMessageAt = Date.now();

      // Update unread count
      if (isActive) {
        conversation.unreadCount = 0;
        await getMessages(user, conversation._id);
        window.dispatchEvent(new Event("messages-read"));
      } else {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        window.dispatchEvent(new Event("messages-read"));
      }

      let newConversations = conversationsRef.current.filter(
        (conversationCompare) => conversation._id !== conversationCompare._id
      );

      newConversations.unshift(conversation);

      props.setConversations(newConversations);
    } else {
      const newConversation = {
        _id: senderId,
        recipient: { _id: senderId, username },
        new: true,
        messages: [newMessage],
        lastMessageAt: Date.now(),
        unreadCount: isActive ? 0 : 1,
      };
      if (isActive) {
        setMessages([newMessage]);
      } else {
        window.dispatchEvent(new Event("messages-read"));
      }
      props.setConversations([newConversation, ...conversationsRef.current]);
    }

    if (isActive) {
      scrollToBottom();
    }
  };

  useEffect(() => {
    socket.on("receive-message", handleReceiveMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return props.conservant ? (
    <>
      {messages && conversation && !loading ? (
        <>
          <HorizontalStack
            alignItems="center"
            spacing={2}
            sx={{ px: 2, height: "60px" }}
          >
            {props.mobile && (
              <IconButton
                onClick={() => props.setConservant(null)}
                sx={{ padding: 0 }}
              >
                <AiFillCaretLeft />
              </IconButton>
            )}
            <UserAvatar
              username={props.conservant.username}
              height={30}
              width={30}
            />
            <Typography>
              <Link to={"/users/" + props.conservant.username}>
                <b>{props.conservant.username}</b>
              </Link>
            </Typography>
          </HorizontalStack>
          <Divider />
          <Box sx={{ height: "calc(100vh - 240px)" }}>
            <Box sx={{ height: "100%" }}>
              <Stack
                sx={{ padding: 2, overflowY: "auto", maxHeight: "100%" }}
                direction="column-reverse"
              >
                <div ref={messagesEndRef} />
                {messages.map((message, i) => (
                  <Message
                    conservant={props.conservant}
                    message={message}
                    key={i}
                  />
                ))}
              </Stack>
            </Box>
          </Box>
          <SendMessage onSendMessage={handleSendMessage} />
        </>
      ) : (
        <Stack sx={{ height: "100%" }} justifyContent="center">
          <Loading />
        </Stack>
      )}
    </>
  ) : (
    <Stack
      sx={{ height: "100%" }}
      justifyContent="center"
      alignItems="center"
      spacing={2}
    >
      <AiFillMessage size={80} />
      <Typography variant="h5">CBIT Broadcast Messenger</Typography>
      <Typography color="text.secondary">
        Privately message other users on CBIT Broadcast
      </Typography>
    </Stack>
  );
};

export default Messages;
