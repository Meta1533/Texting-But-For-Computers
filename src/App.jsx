import { useEffect, useRef, useState } from "react";
import "./App.css";
import { supabase } from "./supabase";
import Auth from "./Auth";
const THEMES = {
  purple: "#6366f1",
  red: "#ef4444",
  yellow: "#eab308",
  orange: "#f97316",
  green: "#22c55e",
  blue: "#3b82f6",
};

const BANNED_WORDS = [

  "fuck",

  "bitch",

 "suck",

"ass ",
"shit",
"sex",
"cunt",
"cock",
"arse",
"dick",
"damn",
"hell ",
"god",
"nigga",
"dammit",
"pussy",
"vagina",
"penis",
"pp",
"moan",
"jesus",
"sin",
"prick",
  
 

];

const USER_STATUSES = {
  online: {
    label: "Online",
    emoji: "🟢",
  },
  touching_grass: {
    label: "Touching grass",
    emoji: "🌱",
  },
  sleeping: {
    label: "Sleeping",
    emoji: "😴",
  },
  dnd: {
    label: "Do Not Disturb",
    emoji: "🔕",
  },
  gaming: {
    label: "Gaming",
    emoji: "🎮",
  },
  studying: {
    label: "Studying",
    emoji: "📚",
  },
};

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Auth onLogin={() => {}} />;
  }

  return <Chat user={session.user} />;
}

function Chat({ user }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [theme, setTheme] = useState("purple");
  const [darkMode, setDarkMode] = useState(false);
  const [themeError, setThemeError] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [contacts, setContacts] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [contactError, setContactError] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [groupError, setGroupError] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);
  const presenceChannelRef = useRef(null);
  const presenceReadyRef = useRef(false);
  const selectedContactRef = useRef(null);
  const selectedGroupRef = useRef(null);
  const [userStatus, setUserStatus] = useState("online");
  function SidebarSection({ icon, title, open, onToggle, children }) {
  return (
    <section className={`sidebar-section ${open ? "open" : "collapsed"}`}>
      <button
        type="button"
        className="sidebar-section-header"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="sidebar-section-title">
          <span className="sidebar-section-icon">{icon}</span>
          <span>{title}</span>
        </span>

        <span className="sidebar-section-arrow">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="sidebar-section-content">
          {children}
        </div>
      )}
    </section>
  );
}

  const [presenceUsers, setPresenceUsers] = useState({});
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [userTag, setUserTag] = useState("just_chatting");
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [profileTags, setProfileTags] = useState({});
// Sidebar collapsible sections
const [profileOpen, setProfileOpen] = useState(true);
const [usernameEditorOpen, setUsernameEditorOpen] = useState(false);
const [settingsOpen, setSettingsOpen] = useState(false);
const [addContactOpen, setAddContactOpen] = useState(false);
const [contactsOpen, setContactsOpen] = useState(true);
const [groupsOpen, setGroupsOpen] = useState(true);
const [groupMembersOpen, setGroupMembersOpen] = useState(true);
const [createGroupOpen, setCreateGroupOpen] = useState(false);

  console.log("CURRENT USER ID:", user.id);


useEffect(() => {
  selectedContactRef.current = selectedContact;
  selectedGroupRef.current = selectedGroup;
}, [selectedContact, selectedGroup]);


  useEffect(() => {
  async function loadProfile() {
    const { data, error } = await supabase
  .from("profiles")
  .select("username, theme, dark_mode")

  .eq("id", user.id)
  .single();

    if (error) {
      console.error("Error loading profile:", error);
      return;
    }

    setUsername(data.username);
    setTheme(data.theme || "purple");
    setDarkMode(data.dark_mode ?? false);

    const { data: tagData, error: tagError } = await supabase
  .from("profile_tags")
  .select("tag_id")
  .eq("user_id", user.id)
  .maybeSingle();

if (tagError) {
  console.error("Error loading profile tag:", tagError);
} else if (tagData) {
  setUserTag(tagData.tag_id);
}

  }



  loadProfile();
}, [user.id]);

useEffect(() => {
  if (!user?.id) return;

  async function loadAllTags() {
    const { data, error } = await supabase
      .from("profile_tags")
      .select("user_id, tag_id");

    if (error) {
      console.error("Error loading profile tags:", error);
      return;
    }

    const tags = {};

    (data || []).forEach((tag) => {
      tags[tag.user_id] = tag.tag_id;
    });

    setProfileTags(tags);
  }

  loadAllTags();

  const channel = supabase
    .channel(`profile-tags-${user.id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "profile_tags",
      },
      (payload) => {
        console.log("Profile tag realtime update:", payload);

        if (payload.eventType === "DELETE") {
          setProfileTags((current) => {
            const updated = { ...current };
            delete updated[payload.old.user_id];
            return updated;
          });

          return;
        }

        const changedTag = payload.new;

        if (!changedTag?.user_id) return;

        setProfileTags((current) => ({
          ...current,
          [changedTag.user_id]: changedTag.tag_id,
        }));

        // Update our own tag if another realtime event reports it.
        if (changedTag.user_id === user.id) {
          setUserTag(changedTag.tag_id);
        }
      }
    )
    .subscribe((status) => {
      console.log("Profile tag realtime status:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, [user.id]);


function changeStatus(newStatus) {
  if (!USER_STATUSES[newStatus]) return;

  setUserStatus(newStatus);
  setShowStatusPicker(false);
}

useEffect(() => {
  if (!user?.id) return;

  const channel = supabase.channel("friend-chat-presence", {
    config: {
      presence: {
        key: user.id,
      },
    },
  });

  presenceChannelRef.current = channel;

  function updatePresenceState() {
    const state = channel.presenceState();

    console.log("RAW PRESENCE STATE:", state);

    const users = {};

    Object.values(state).forEach((presences) => {
      const presence = presences?.[0];

      if (!presence?.userId) return;

      users[presence.userId] = {
        userId: presence.userId,
        username: presence.username || "Unknown user",
        status: presence.status || "online",
        onlineAt: presence.onlineAt,
      };
    });

    console.log("PARSED PRESENCE USERS:", users);

    setPresenceUsers(users);
  }

  channel
    .on("presence", { event: "sync" }, updatePresenceState)
    .on("presence", { event: "join" }, updatePresenceState)
    .on("presence", { event: "leave" }, updatePresenceState)
    .subscribe(async (status) => {
      console.log("Presence channel status:", status);

      if (status !== "SUBSCRIBED") {
        return;
      }

      presenceReadyRef.current = true;

      const { error } = await channel.track({
        userId: user.id,
        username: username || "Unknown user",
        status: userStatus,
        onlineAt: new Date().toISOString(),
      });

      if (error) {
        console.error("Initial presence track error:", error);
      }

      updatePresenceState();
    });

  return () => {
    presenceReadyRef.current = false;
    presenceChannelRef.current = null;
    supabase.removeChannel(channel);
  };
}, [user.id]);

async function changeTag(newTag) {
  if (!USER_TAGS[newTag]) return;

  const { error } = await supabase
    .from("profile_tags")
    .upsert(
      {
        user_id: user.id,
        tag_id: newTag,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

  if (error) {
    console.error("Error saving tag:", error);
    alert("Could not save tag: " + error.message);
    return;
  }

  setUserTag(newTag);
  setShowTagPicker(false);
}


useEffect(() => {
  const channel = presenceChannelRef.current;

  if (!channel || !presenceReadyRef.current) {
    return;
  }

  channel
    .track({
      userId: user.id,
      username: username || "Unknown user",
      status: userStatus,
      onlineAt: new Date().toISOString(),
    })
    .then(({ error }) => {
      if (error) {
        console.error("Presence status update error:", error);
      }
    });
}, [userStatus, username, user.id]);

// Load contacts
useEffect(() => {
  async function loadContacts() {
    const { data, error } = await supabase
      .from("contacts")
      .select("id, contact_id, profiles:contact_id(id, username)")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error loading contacts:", error);
      return;
    }

    setContacts(data || []);
    console.log("My contacts:", data);
  }

  loadContacts();
}, [user.id]);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [messages]);

useEffect(() => {
  async function loadUnread() {
    const { data, error } = await supabase
      .from("messages")
      .select("user_id")
      .eq("recipient_id", user.id)
      .is("read_at", null);

    if (error) {
      console.error("Error loading unread messages:", error);
      return;
    }

    const counts = {};

    (data || []).forEach((msg) => {
      if (msg.user_id === user.id) return;

      counts[msg.user_id] = (counts[msg.user_id] || 0) + 1;
    });

    setUnreadCounts(counts);
  }

  loadUnread();
}, [user.id]);


useEffect(() => {
  async function loadGroups() {
    const { data, error } = await supabase
      .from("groups")
      .select(`
        id,
        name,
        created_by,
        created_at
      `)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading groups:", error);
      return;
    }

    setGroups(data || []);
    console.log("My groups:", data);
  }

  loadGroups();
}, [user.id]);

useEffect(() => {
  async function loadGroupMembers() {
    if (!selectedGroup) {
      setGroupMembers([]);
      return;
    }

    const { data, error } = await supabase
  .from("group_members")
  .select("id, user_id")
  .eq("group_id", selectedGroup.id);

    if (error) {
      console.error("Error loading group members:", error);
      return;
    }

    if (!data) {
  setGroupMembers([]);
  return;
}

const userIds = data.map((member) => member.user_id);

const { data: profiles, error: profilesError } = await supabase
  .from("profiles")
  .select("id, username")
  .in("id", userIds);

if (profilesError) {
  console.error("Error loading member profiles:", profilesError);
  return;
}

const membersWithProfiles = data.map((member) => ({
  ...member,
  profile: profiles.find((profile) => profile.id === member.user_id),
}));

setGroupMembers(membersWithProfiles);
console.log("Group members:", membersWithProfiles);
  }

  loadGroupMembers();
}, [selectedGroup]);

useEffect(() => {
  async function loadGroupMessages() {
    if (!selectedGroup) {
      return;
    }

    const { data, error } = await supabase
      .from("group_messages")
      .select("id, group_id, user_id, content, created_at")
      .eq("group_id", selectedGroup.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading group messages:", error);
      setMessages([]);
      return;
    }

    if (!data || data.length === 0) {
      setMessages([]);
      return;
    }

    const userIds = [...new Set(data.map((msg) => msg.user_id))];

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds);

    if (profilesError) {
      console.error(
        "Error loading group message profiles:",
        profilesError
      );
      setMessages([]);
      return;
    }

    const messagesWithUsers = data.map((msg) => ({
      id: msg.id,
      text: msg.content,
      sent: msg.user_id === user.id,
      userId: msg.user_id,
      username:
        profiles.find((profile) => profile.id === msg.user_id)?.username ||
        "Unknown user",
      createdAt: msg.created_at,
    }));

    setMessages(messagesWithUsers);
  }

  loadGroupMessages();
}, [selectedGroup, user.id]);

useEffect(() => {
  async function loadConversation() {
    if (!selectedContact || selectedGroup) {
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading private messages:", error);
      setMessages([]);
      return;
    }

    const conversationMessages = (data || [])
      .filter(
        (msg) =>
          (msg.user_id === user.id &&
            msg.recipient_id === selectedContact.id) ||
          (msg.user_id === selectedContact.id &&
            msg.recipient_id === user.id)
      )
      .map((msg) => ({
        id: msg.id,
        text: msg.content,
        sent: msg.user_id === user.id,
        createdAt: msg.created_at,
      }));

    setMessages(conversationMessages);
  }

  loadConversation();
}, [selectedContact, selectedGroup, user.id]);

 useEffect(() => {
  if (!selectedContact || selectedGroup) {
    return;
  }

  const channel = supabase
    .channel(`messages-${user.id}-${selectedContact.id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        const msg = payload.new;

        const belongsToConversation =
          (msg.user_id === user.id &&
            msg.recipient_id === selectedContact.id) ||
          (msg.user_id === selectedContact.id &&
            msg.recipient_id === user.id);

        if (!belongsToConversation) return;

        setMessages((currentMessages) => {
  if (currentMessages.some((existing) => existing.id === msg.id)) {
    return currentMessages;
  }

  return [
    ...currentMessages,
    {
      id: msg.id,
      text: msg.content,
      sent: msg.user_id === user.id,
      createdAt: msg.created_at,
    },
  ];
});
      }
    )
    .subscribe((status) => {
      console.log("Private realtime status:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, [selectedContact, selectedGroup, user.id]);

useEffect(() => {
  if (!selectedGroup) {
    return;
  }

  const channel = supabase
    .channel(`group-messages-${selectedGroup.id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "group_messages",
        filter: `group_id=eq.${selectedGroup.id}`,
      },
      async (payload) => {
        const msg = payload.new;

        console.log("Group realtime message:", msg);

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, username")
          .eq("id", msg.user_id)
          .single();

        if (error) {
          console.error(
            "Error loading realtime message profile:",
            error
          );
        }

        setMessages((currentMessages) => {
          if (
            currentMessages.some(
              (existing) => existing.id === msg.id
            )
          ) {
            return currentMessages;
          }

          return [
            ...currentMessages,
            {
              id: msg.id,
              text: msg.content,
              sent: msg.user_id === user.id,
              userId: msg.user_id,
              username: profile?.username || "Unknown user",
              createdAt: msg.created_at,
            },
          ];
        });
      }
    )
    .subscribe((status, error) => {
      console.log("Group realtime status:", status);

      if (error) {
        console.error("Group realtime error:", error);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, [selectedGroup, user.id]);

useEffect(() => {
  const channel = supabase
    .channel(`unread-${user.id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `recipient_id=eq.${user.id}`,
      },
      (payload) => {
        const newMessage = payload.new;

        // Ignore messages sent to yourself.
        if (newMessage.user_id === user.id) {
          return;
        }

        // If this conversation is currently open,
        // mark the new message as read immediately.
        if (
          selectedContactRef.current?.id === newMessage.user_id &&
          !selectedGroupRef.current
        ) {
          supabase
            .from("messages")
            .update({
              read_at: new Date().toISOString(),
            })
            .eq("id", newMessage.id)
            .then(({ error }) => {
              if (error) {
                console.error(
                  "Error marking realtime message as read:",
                  error
                );
              }
            });

          return;
        }

        // Otherwise, increase the unread count.
        setUnreadCounts((current) => ({
          ...current,
          [newMessage.user_id]:
            (current[newMessage.user_id] || 0) + 1,
        }));
      }
    )
    .subscribe((status) => {
      console.log("Unread realtime status:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, [user.id]);

  
  async function sendMessage() {
  if (message.trim() === "") return;

  // =========================
  // GROUP MESSAGE
  // =========================
  if (selectedGroup) {
    const { data, error } = await supabase
      .from("group_messages")
      .insert({
        group_id: selectedGroup.id,
        user_id: user.id,
        content: message.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending group message:", error);
      return;
    }

    setMessage("");
    return;
  }

  // =========================
  // PRIVATE MESSAGE
  // =========================
  if (!selectedContact) {
    alert("Select a contact before sending a message.");
    return;
  }

  const trimmedMessage = message.trim();

  // Check for banned words
  const containsBannedWord = BANNED_WORDS.some((word) =>
    trimmedMessage.toLowerCase().includes(word.toLowerCase())
  );

  const messageToSend = containsBannedWord
    ? "#".repeat(trimmedMessage.length)
    : trimmedMessage;

  // Actually INSERT the private message
  const { data, error } = await supabase
    .from("messages")
    .insert({
      user_id: user.id,
      recipient_id: selectedContact.id,
      content: messageToSend,
    })
    .select()
    .single();

  if (error) {
    console.error("Error sending private message:", error);
    alert("Could not send message: " + error.message);
    return;
  }

  console.log("Private message sent:", data);

  // Clear input
  setMessage("");

  // Mark any messages from the other person as read
  const { error: readError } = await supabase
  .from("messages")
  .update({
    read_at: new Date().toISOString(),
  })
  .eq("user_id", selectedContact.id)
  .eq("recipient_id", user.id)
  .is("read_at", null);

if (readError) {
  console.error("Error marking messages as read:", readError);
} else {
  setUnreadCounts((current) => ({
    ...current,
    [selectedContact.id]: 0,
  }));
}

}
async function searchForContact() {
  const search = contactSearch.trim();

  setSearchResult(null);
  setContactError("");

  if (search === "") {
    setContactError("Enter a username to search for.");
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", search)
    .maybeSingle();

  if (error) {
    console.error("Error searching for contact:", error);
    setContactError(error.message);
    return;
  }

  if (!data) {
    setContactError("No user found with that username.");
    return;
  }

  if (data.id === user.id) {
    setContactError("You can't add yourself as a contact.");
    return;
  }

  setSearchResult(data);
}
async function changeUsername() {
  const trimmedUsername = newUsername.trim();

  if (trimmedUsername.length < 3) {
    setUsernameError("Username must be at least 3 characters.");
    return;
  }

  if (trimmedUsername.length > 20) {
    setUsernameError("Username must be 20 characters or less.");
    return;
  }

  if (trimmedUsername === username) {
    setUsernameError("That's already your username.");
    return;
  }

  setUsernameError("");

  const { error } = await supabase
    .from("profiles")
    .update({ username: trimmedUsername })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      setUsernameError("That username is already taken.");
    } else {
      setUsernameError(error.message);
    }
    return;
  }

  setUsername(trimmedUsername);
  setNewUsername("");
  setShowUsernameEditor(false);
}
  
async function changeTheme(newTheme) {
  setThemeError("");

  const { error } = await supabase
    .from("profiles")
    .update({ theme: newTheme })
    .eq("id", user.id);

  if (error) {
    console.error("Error changing theme:", error);
    setThemeError(error.message);
    return;
  }

  setTheme(newTheme);
}

async function changeDarkMode(enabled) {
  console.log("Saving dark mode:", enabled);

  const { data, error } = await supabase
    .from("profiles")
    .update({ dark_mode: enabled })
    .eq("id", user.id)
    .select("dark_mode")
    .single();

  if (error) {
    console.error("DARK MODE SAVE ERROR:", error);
    alert("Could not save dark mode: " + error.message);
    return;
  }

  console.log("Dark mode saved:", data);

  setDarkMode(data.dark_mode);
}

async function addContact() {
  if (!searchResult) return;

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      user_id: user.id,
      contact_id: searchResult.id,
    })
    .select("id, contact_id, profiles:contact_id(id, username)")
    .single();

  if (error) {
    if (error.code === "23505") {
      setContactError("This person is already in your contacts.");
    } else {
      console.error("Error adding contact:", error);
      setContactError(error.message);
    }
    return;
  }

  setContacts((currentContacts) => [...currentContacts, data]);
  setSearchResult(null);
  setContactSearch("");

  alert("Contact added!");
}

async function removeContact(contactId) {
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("user_id", user.id)
    .eq("contact_id", contactId);

  if (error) {
    console.error("Error removing contact:", error);
    alert("Could not remove contact: " + error.message);
    return;
  }

  const { data: remainingContact, error: checkError } = await supabase
    .from("contacts")
    .select("id")
    .eq("user_id", user.id)
    .eq("contact_id", contactId)
    .maybeSingle();

  if (checkError) {
    console.error("Error checking contact:", checkError);
    return;
  }

  if (remainingContact) {
    alert("The contact is still in the database.");
    return;
  }

  setContacts((currentContacts) =>
    currentContacts.filter(
      (contact) => contact.contact_id !== contactId
    )
  );

  if (selectedContact?.id === contactId) {
    setSelectedContact(null);
    setMessages([]);
  }
}

async function createGroup() {
  const trimmedName = groupName.trim();

  if (trimmedName === "") {
    setGroupError("Enter a group name.");
    return;
  }

  if (trimmedName.length > 30) {
    setGroupError("Group name must be 30 characters or less.");
    return;
  }

  setGroupError("");

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name: trimmedName,
      created_by: user.id,
    })
    .select()
    .single();

  if (groupError) {
    console.error("Error creating group:", groupError);
    setGroupError(groupError.message);
    return;
  }

  const { error: memberError } = await supabase
    .from("group_members")
    .insert({
      group_id: group.id,
      user_id: user.id,
    });

  if (memberError) {
    console.error("Error adding group creator:", memberError);
    setGroupError(memberError.message);

    // Clean up the group if adding the creator failed.
    await supabase
      .from("groups")
      .delete()
      .eq("id", group.id);

    return;
  }

  setGroups((currentGroups) => [...currentGroups, group]);
  setSelectedGroup(group);
  setGroupName("");
  setCreateGroupOpen(false);

  console.log("Group created:", group);
}

async function logOut() {
    await supabase.auth.signOut();
  }

  return (
  <div
  className="app"
  data-theme={darkMode ? "dark" : "light"}
  style={{
    "--primary": THEMES[theme],
  }}
>
      <aside className="sidebar">
  <h2>Friend Chat</h2>

  {/* =====================================================
      PROFILE
      ===================================================== */}

  <SidebarSection
    icon="👤"
    title="My profile"
    open={profileOpen}
    onToggle={() => setProfileOpen((current) => !current)}
  >
    <div className="friend">
      <div className="avatar">
        {username?.charAt(0).toUpperCase() || "?"}
      </div>

      <div className="friend-info">
        <strong>{username || "Loading..."}</strong>

        {/* STATUS */}
        <button
          type="button"
          className="status-button"
          onClick={() =>
            setShowStatusPicker((current) => !current)
          }
        >
          <span>
            {USER_STATUSES[userStatus].emoji}{" "}
            {USER_STATUSES[userStatus].label}
          </span>

          <span className="status-arrow">
            {showStatusPicker ? "▲" : "▼"}
          </span>
        </button>

        {/* TAG */}
        <button
          type="button"
          className="tag-button"
          onClick={() =>
            setShowTagPicker((current) => !current)
          }
        >
          <span className="profile-tag-pill">
            <span className="profile-tag-emoji">
              {USER_TAGS[userTag]?.emoji}
            </span>

            <span>
              {USER_TAGS[userTag]?.label || "Choose a tag"}
            </span>
          </span>

          <span className="status-arrow">
            {showTagPicker ? "▲" : "▼"}
          </span>
        </button>
      </div>
    </div>

    {/* STATUS MENU */}
    {showStatusPicker && (
      <div className="status-menu">
        <div className="status-menu-header">
          <strong>Set your status</strong>
          <span>How are you doing?</span>
        </div>

        <div className="status-options">
          {Object.entries(USER_STATUSES).map(
            ([statusId, status]) => (
              <button
                type="button"
                key={statusId}
                className={`status-option ${
                  userStatus === statusId ? "selected" : ""
                }`}
                onClick={() => changeStatus(statusId)}
              >
                <span className="status-option-icon">
                  {status.emoji}
                </span>

                <span className="status-option-text">
                  {status.label}
                </span>

                {userStatus === statusId && (
                  <span className="status-check">✓</span>
                )}
              </button>
            )
          )}
        </div>
      </div>
    )}

    {/* TAG MENU */}
    {showTagPicker && (
      <div className="tag-menu">
        <div className="tag-menu-header">
          <strong>Choose your tag</strong>
          <span>Show people your vibe</span>
        </div>

        <div className="tag-options">
          {Object.entries(USER_TAGS).map(
            ([tagId, tag]) => (
              <button
                type="button"
                key={tagId}
                className={`tag-option ${
                  userTag === tagId ? "selected" : ""
                }`}
                onClick={() => changeTag(tagId)}
              >
                <span className="tag-option-icon">
                  {tag.emoji}
                </span>

                <span className="tag-option-text">
                  {tag.label}
                </span>

                {userTag === tagId && (
                  <span className="tag-check">✓</span>
                )}
              </button>
            )
          )}
        </div>
      </div>
    )}
  </SidebarSection>

  {/* =====================================================
      USERNAME
      ===================================================== */}

  <SidebarSection
    icon="✏️"
    title="Username"
    open={usernameEditorOpen}
    onToggle={() => {
      setUsernameEditorOpen((current) => !current);
      setUsernameError("");
      setNewUsername(username);
    }}
  >
    <input
      type="text"
      placeholder="New username"
      value={newUsername}
      onChange={(event) => {
        setNewUsername(event.target.value);
        setUsernameError("");
      }}
      minLength={3}
      maxLength={20}
    />

    <button
      type="button"
      className="sidebar-primary-button"
      onClick={changeUsername}
    >
      Save username
    </button>

    {usernameError && (
      <p className="sidebar-error">{usernameError}</p>
    )}
  </SidebarSection>

  {/* =====================================================
      SETTINGS
      ===================================================== */}

  <SidebarSection
    icon="⚙️"
    title="Settings"
    open={settingsOpen}
    onToggle={() => setSettingsOpen((current) => !current)}
  >
    <div className="settings">
      <div className="settings-block">
        <p>Accent color</p>

        <div className="theme-grid">
          <button
            type="button"
            className={theme === "purple" ? "theme-selected" : ""}
            onClick={() => changeTheme("purple")}
          >
            🟣 Purple
          </button>

          <button
            type="button"
            className={theme === "red" ? "theme-selected" : ""}
            onClick={() => changeTheme("red")}
          >
            🔴 Red
          </button>

          <button
            type="button"
            className={theme === "yellow" ? "theme-selected" : ""}
            onClick={() => changeTheme("yellow")}
          >
            🟡 Yellow
          </button>

          <button
            type="button"
            className={theme === "orange" ? "theme-selected" : ""}
            onClick={() => changeTheme("orange")}
          >
            🟠 Orange
          </button>

          <button
            type="button"
            className={theme === "green" ? "theme-selected" : ""}
            onClick={() => changeTheme("green")}
          >
            🟢 Green
          </button>

          <button
            type="button"
            className={theme === "blue" ? "theme-selected" : ""}
            onClick={() => changeTheme("blue")}
          >
            🔵 Blue
          </button>
        </div>

        {themeError && (
          <p className="sidebar-error">{themeError}</p>
        )}
      </div>

      <div className="settings-block">
        <p>Appearance</p>

        <div className="appearance-buttons">
          <button
            type="button"
            className={!darkMode ? "theme-selected" : ""}
            onClick={() => changeDarkMode(false)}
          >
            ☀️ Light
          </button>

          <button
            type="button"
            className={darkMode ? "theme-selected" : ""}
            onClick={() => changeDarkMode(true)}
          >
            🌙 Dark
          </button>
        </div>
      </div>
    </div>
  </SidebarSection>

  {/* =====================================================
      ADD CONTACT
      ===================================================== */}

  <SidebarSection
    icon="➕"
    title="Add a contact"
    open={addContactOpen}
    onToggle={() => setAddContactOpen((current) => !current)}
  >
    <input
      type="text"
      placeholder="Search username..."
      value={contactSearch}
      onChange={(event) => {
        setContactSearch(event.target.value);
        setContactError("");
        setSearchResult(null);
      }}
    />

    <button
      type="button"
      className="sidebar-primary-button"
      onClick={searchForContact}
    >
      Search
    </button>

    {contactError && (
      <p className="sidebar-error">{contactError}</p>
    )}

    {searchResult && (
      <div className="search-result">
        <div className="search-result-user">
          <div className="avatar small">
            {searchResult.username
              .charAt(0)
              .toUpperCase()}
          </div>

          <strong>{searchResult.username}</strong>
        </div>

        <button
          type="button"
          onClick={addContact}
        >
          Add
        </button>
      </div>
    )}
  </SidebarSection>

  {/* =====================================================
      CONTACTS
      ===================================================== */}

  <SidebarSection
    icon="👥"
    title={`Your contacts${
      contacts.length ? ` (${contacts.length})` : ""
    }`}
    open={contactsOpen}
    onToggle={() => setContactsOpen((current) => !current)}
  >
    {contacts.length === 0 ? (
      <p className="empty-sidebar-message">
        No contacts yet.
      </p>
    ) : (
      contacts.map((contact) => {
        const contactId = contact.profiles.id;
        const tagId = profileTags[contactId];
        const tag = USER_TAGS[tagId];
        const presence = presenceUsers[contactId];

        const status = presence
          ? USER_STATUSES[presence.status] ||
            USER_STATUSES.online
          : null;

        const isSelected =
          selectedContact?.id === contactId;

        return (
          <div
            className={`contact-item ${
              isSelected ? "selected-contact" : ""
            }`}
            key={contact.id}
            onClick={async () => {
              setSelectedContact(contact.profiles);
              setSelectedGroup(null);

              setUnreadCounts((current) => ({
                ...current,
                [contactId]: 0,
              }));

              const { error } = await supabase
                .from("messages")
                .update({
                  read_at: new Date().toISOString(),
                })
                .eq("user_id", contactId)
                .eq("recipient_id", user.id)
                .is("read_at", null);

              if (error) {
                console.error(
                  "Error marking messages as read:",
                  error
                );
              }
            }}
          >
            <div className="avatar">
              {contact.profiles.username
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="contact-details">
              <div className="contact-name-row">
                <strong>
                  {contact.profiles.username}
                </strong>

                {unreadCounts[contactId] > 0 && (
                  <span className="unread-badge">
                    {unreadCounts[contactId]}
                  </span>
                )}
              </div>

              {tag && (
                <div className="contact-tag">
                  <span>{tag.emoji}</span>
                  <span>{tag.label}</span>
                </div>
              )}

              {status ? (
                <p className="contact-status">
                  {status.emoji} {status.label}
                </p>
              ) : (
                <p className="contact-status offline">
                  ⚪ Offline
                </p>
              )}
            </div>

            <button
              type="button"
              className="remove-contact-button"
              onClick={(event) => {
                event.stopPropagation();
                removeContact(contact.contact_id);
              }}
            >
              ×
            </button>
          </div>
        );
      })
    )}
  </SidebarSection>

  {/* =====================================================
      GROUPS
      ===================================================== */}

  <SidebarSection
    icon="👨‍👩‍👧"
    title={`Group chats${
      groups.length ? ` (${groups.length})` : ""
    }`}
    open={groupsOpen}
    onToggle={() => setGroupsOpen((current) => !current)}
  >
    <button
      type="button"
      className="create-group-button"
      onClick={() =>
        setCreateGroupOpen((current) => !current)
      }
    >
      {createGroupOpen
        ? "− Cancel"
        : "+ Create group"}
    </button>

    {createGroupOpen && (
      <div className="create-group-panel">
        <input
          type="text"
          placeholder="Group name..."
          value={groupName}
          onChange={(event) => {
            setGroupName(event.target.value);
            setGroupError("");
          }}
          maxLength={30}
        />

        <button
          type="button"
          className="sidebar-primary-button"
          onClick={async () => {
            await createGroup();
            setCreateGroupOpen(false);
          }}
        >
          Create group
        </button>

        {groupError && (
          <p className="sidebar-error">
            {groupError}
          </p>
        )}
      </div>
    )}

    <div className="subsection-label">
      Your groups
    </div>

    {groups.length === 0 ? (
      <p className="empty-sidebar-message">
        No groups yet.
      </p>
    ) : (
      groups.map((group) => {
        const isSelected =
          selectedGroup?.id === group.id;

        return (
          <div
            className={`contact-item ${
              isSelected ? "selected-contact" : ""
            }`}
            key={group.id}
            onClick={() => {
              setSelectedGroup(group);
              setSelectedContact(null);
              setGroupMembersOpen(true);
            }}
          >
            <div className="avatar">
              {group.name.charAt(0).toUpperCase()}
            </div>

            <div className="contact-details">
              <strong>{group.name}</strong>

              <p className="contact-status">
                Group chat
              </p>
            </div>
          </div>
        );
      })
    )}
  </SidebarSection>

  {/* =====================================================
      SELECTED GROUP
      ===================================================== */}

  {selectedGroup && (
    <SidebarSection
      icon="🧑‍🤝‍🧑"
      title={`${selectedGroup.name} members`}
      open={groupMembersOpen}
      onToggle={() =>
        setGroupMembersOpen((current) => !current)
      }
    >
      {selectedGroup.created_by === user.id && (
        <div className="group-management">
          <button
            type="button"
            onClick={() => {
              setShowAddMembers((current) => !current);
              setMemberError("");
            }}
          >
            {showAddMembers
              ? "− Hide add members"
              : "+ Add members"}
          </button>

          {showAddMembers && (
            <div className="add-members">
              <h4>
                Add people to {selectedGroup.name}
              </h4>

              {contacts.length === 0 ? (
                <p>
                  You don't have any contacts to add.
                </p>
              ) : (
                contacts.map((contact) => {
                  const alreadyMember =
                    groupMembers.some(
                      (member) =>
                        member.user_id ===
                        contact.profiles.id
                    );

                  if (alreadyMember) return null;

                  return (
                    <div
                      className="add-member-row"
                      key={contact.id}
                    >
                      <span>
                        {contact.profiles.username}
                      </span>

                      <button
                        type="button"
                        onClick={async () => {
                          const { error } =
                            await supabase
                              .from("group_members")
                              .insert({
                                group_id:
                                  selectedGroup.id,
                                user_id:
                                  contact.profiles.id,
                              });

                          if (error) {
                            if (
                              error.code === "23505"
                            ) {
                              setMemberError(
                                "That person is already in the group."
                              );
                            } else {
                              console.error(
                                "Error adding member:",
                                error
                              );
                              setMemberError(
                                error.message
                              );
                            }

                            return;
                          }

                          const {
                            data: updatedMembers,
                            error: membersError,
                          } = await supabase
                            .from("group_members")
                            .select(
                              "id, user_id, profiles:profiles!group_members_user_id_fkey(id, username)"
                            )
                            .eq(
                              "group_id",
                              selectedGroup.id
                            );

                          if (membersError) {
                            console.error(
                              "Error refreshing group members:",
                              membersError
                            );
                          } else {
                            setGroupMembers(
                              updatedMembers || []
                            );
                          }

                          setMemberError("");
                        }}
                      >
                        Add
                      </button>
                    </div>
                  );
                })
              )}

              {memberError && (
                <p className="sidebar-error">
                  {memberError}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            className="danger-button"
            onClick={async () => {
              const confirmed = window.confirm(
                `Are you sure you want to delete "${selectedGroup.name}"? This cannot be undone.`
              );

              if (!confirmed) return;

              const { error } = await supabase
                .from("groups")
                .delete()
                .eq("id", selectedGroup.id);

              if (error) {
                console.error(
                  "Error deleting group:",
                  error
                );
                setGroupError(error.message);
                return;
              }

              setGroups((currentGroups) =>
                currentGroups.filter(
                  (group) =>
                    group.id !== selectedGroup.id
                )
              );

              setSelectedGroup(null);
              setGroupMembers([]);
              setMessages([]);
              setGroupError("");

              alert("Group deleted.");
            }}
          >
            Delete group
          </button>
        </div>
      )}

      {selectedGroup.created_by !== user.id && (
        <div className="group-management">
          <button
            type="button"
            className="danger-button"
            onClick={async () => {
              const confirmed = window.confirm(
                `Leave "${selectedGroup.name}"?`
              );

              if (!confirmed) return;

              const { error } = await supabase
                .from("group_members")
                .delete()
                .eq(
                  "group_id",
                  selectedGroup.id
                )
                .eq("user_id", user.id);

              if (error) {
                console.error(
                  "Error leaving group:",
                  error
                );
                setGroupError(error.message);
                return;
              }

              setGroups((currentGroups) =>
                currentGroups.filter(
                  (group) =>
                    group.id !== selectedGroup.id
                )
              );

              setSelectedGroup(null);
              setGroupMembers([]);
              setMessages([]);
              setGroupError("");

              alert("You left the group.");
            }}
          >
            Leave group
          </button>
        </div>
      )}

      {groupError && (
        <p className="sidebar-error">{groupError}</p>
      )}

      <div className="member-list">
        {groupMembers.map((member) => (
          <div
            key={member.id}
            className="contact-item"
          >
            <div className="avatar">
              {member.profile?.username
                ?.charAt(0)
                .toUpperCase() || "?"}
            </div>

            <strong>
              {member.profile?.username ||
                "Unknown user"}
            </strong>
          </div>
        ))}
      </div>
    </SidebarSection>
  )}

  <button
    type="button"
    className="logout-button"
    onClick={logOut}
  >
    🚪 Log out
  </button>
</aside>


      <main className="chat">
        <header className="chat-header">
          <div className="avatar">
  {selectedGroup
    ? selectedGroup.name.charAt(0).toUpperCase()
    : selectedContact
      ? selectedContact.username.charAt(0).toUpperCase()
      : "?"}
</div>

          <div>
            <h3>
  {selectedGroup
    ? selectedGroup.name
    : selectedContact
      ? selectedContact.username
      : "Select a contact"}
</h3>

<p>
  {selectedGroup
    ? "Group chat"
    : selectedContact
      ? (() => {
          const presence =
            presenceUsers[selectedContact.id];

          const tagId = profileTags[selectedContact.id];
          const tag = USER_TAGS[tagId];

          const statusText = presence
            ? `${
                (USER_STATUSES[presence.status] ||
                  USER_STATUSES.online).emoji
              } ${
                (USER_STATUSES[presence.status] ||
                  USER_STATUSES.online).label
              }`
            : "⚪ Offline";

          if (!tag) {
            return statusText;
          }

          return `${tag.emoji} ${tag.label} • ${statusText}`;
        })()
      : "Choose someone from your contacts"}
</p>

          </div>
        </header>

       <section className="messages">
  {messages.map((msg, index) => (
    <div
      key={msg.id || index}
      className={`message-wrapper ${
        msg.sent ? "sent" : "received"
      }`}
    >
      {selectedGroup && (
        <div className="message-sender">
          {msg.username}
        </div>
      )}

      <div className="message">
        {msg.text}
      </div>
    </div>
  ))}

  <div ref={messagesEndRef} />
</section>

        <div className="message-box">
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                sendMessage();
              }
            }}
          />
 
          <button onClick={sendMessage}>Send</button>
        </div>
      </main>
    </div>
  );
}

export default App;
const USER_TAGS = {
  just_chatting: {
    label: "Just Chatting",
    emoji: "💬",
  },
  night_owl: {
    label: "Night Owl",
    emoji: "🌙",
  },
  early_bird: {
    label: "Early Bird",
    emoji: "☀️",
  },
  certified_yapper: {
    label: "Certified Yapper",
    emoji: "😂",
  },
  bestie: {
    label: "Bestie",
    emoji: "🫶",
  },
  lurking: {
    label: "Lurking",
    emoji: "👀",
  },
  on_fire: {
    label: "On Fire",
    emoji: "🔥",
  },
  im_dead: {
    label: "I'm Dead",
    emoji: "💀",
  },
  overthinker: {
    label: "Overthinker",
    emoji: "🧠",
  },
  music_lover: {
    label: "Music Lover",
    emoji: "🎧",
  },
  gamer: {
    label: "Gamer",
    emoji: "🎮",
  },
  chronically_online: {
    label: "Chronically Online",
    emoji: "📱",
  },
  main_character: {
    label: "Main Character",
    emoji: "✨",
  },
  probably_sleeping: {
    label: "Probably Sleeping",
    emoji: "💤",
  },
  lowkey: {
    label: "Lowkey",
    emoji: "🤫",
  },
  icon: {
    label: "Icon",
    emoji: "💅",
  },
  barely_functioning: {
    label: "Barely Functioning",
    emoji: "🫠",
  },
  farmer: {
    label: "Farmer",
    emoji: "🐎",
  },
  vibing: {
    label: "Vibing",
    emoji: "🧃",
  },
  always_online: {
    label: "Always Online",
    emoji: "🚀",
  },
  softie: {
    label: "Softie",
    emoji: "🌸",
  },
  menace: {
    label: "Menace",
    emoji: "😈",
  },
  nerd: {
    label: "Nerd",
    emoji: "🤓",
  },
  talks_too_much: {
    label: "Talks Too Much",
    emoji: "🗣️",
  },
  mysterious: {
    label: "Mysterious",
    emoji: "🕶️",
  },
  top_tier: {
    label: "Top Tier",
    emoji: "🏆",
  },
  silly_goose: {
    label: "Silly Goose",
    emoji: "🐸",
  },
  in_my_feels: {
    label: "In My Feels",
    emoji: "🌧️",
  },
  big_brain: {
    label: "Big Brain",
    emoji: "💡",
  },
  here_for_a_good_time: {
    label: "Here for a Good Time",
    emoji: "🪩",
  },
};
