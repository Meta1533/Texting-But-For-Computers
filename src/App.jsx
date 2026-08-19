import { useEffect, useState } from "react";
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
  const [showSettings, setShowSettings] = useState(false);
  const [themeError, setThemeError] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [showUsernameEditor, setShowUsernameEditor] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [contacts, setContacts] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [contactError, setContactError] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupCreator, setShowGroupCreator] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupError, setGroupError] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
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
  }



  loadProfile();
}, [user.id]);

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
  async function loadUnread() {
    const { data } = await supabase
      .from("messages")
      .select("user_id")
      .eq("recipient_id", user.id)
      .is("read_at", null);

    const counts = {};

    (data || []).forEach((msg) => {
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

        setMessages((currentMessages) => [
          ...currentMessages,
          {
            text: msg.content,
            sent: msg.user_id === user.id,
          },
        ]);
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

        // If you're currently talking to this person,
        // don't show an unread number.
        if (
          selectedContact &&
          selectedContact.id === newMessage.user_id &&
          !selectedGroup
        ) {
          return;
        }

        // Otherwise, increase their unread number.
        setUnreadCounts((current) => ({
          ...current,
          [newMessage.user_id]:
            (current[newMessage.user_id] || 0) + 1,
        }));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user.id, selectedContact, selectedGroup]);
  
  async function sendMessage() {
    if (selectedGroup) {
  if (message.trim() === "") return;

  const { data, error } = await supabase
    .from("group_messages")
    .insert({
      group_id: selectedGroup.id,
      user_id: user.id,
      content: message,
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
  if (!selectedContact) return;
  if (message.trim() === "") return;

  const containsBannedWord = BANNED_WORDS.some((word) =>
    message.toLowerCase().includes(word.toLowerCase())
  );

  const messageToSend = containsBannedWord
    ? "#".repeat(message.length)
    : message;

  if (!selectedContact) {
    alert("Select a contact before sending a message.");
    return;
  }

  console.log("Logged in user:", user.id);

  const { error } = await supabase
  .from("messages")
  .insert({
    content: messageToSend,
    user_id: user.id,
    recipient_id: selectedContact.id,
  });
  if (error) {
    console.error("Error sending message:", error);
    return;
  }

  setMessage("");
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
  setShowGroupCreator(false);

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

        <div className="friend active">
          <div className="avatar">A</div>
          <div>
            <strong>{username}</strong>
            <p>Online</p>
          </div>
        </div>

        <button
  onClick={() => {
    setShowUsernameEditor(!showUsernameEditor);
    setUsernameError("");
    setNewUsername(username);
  }}
>
  Change username
</button>

<button onClick={() => setShowSettings(!showSettings)}>
  Settings
</button>

{showSettings && (
  <div className="settings">
    <h3>Settings</h3>

    <p>Choose your color:</p>

    <button onClick={() => changeTheme("purple")}>
      🟣 Purple
    </button>

    <button onClick={() => changeTheme("red")}>
      🔴 Red
    </button>

    <button onClick={() => changeTheme("yellow")}>
      🟡 Yellow
    </button>

    <button onClick={() => changeTheme("orange")}>
      🟠 Orange
    </button>

    <button onClick={() => changeTheme("green")}>
      🟢 Green
    </button>

    <button onClick={() => changeTheme("blue")}>
      🔵 Blue
    </button>

    <p>Appearance:</p>

    <button
  onClick={() => {
    console.log("LIGHT MODE BUTTON CLICKED");
    changeDarkMode(false);
  }}
>
  ☀️ Light Mode
</button>

<button
  onClick={() => {
    console.log("DARK MODE BUTTON CLICKED");
    changeDarkMode(true);
  }}
>
  🌙 Dark Mode
</button>
  </div>
)}

{showUsernameEditor && (
  <div>
    <input
      type="text"
      placeholder="New username"
      value={newUsername}
      onChange={(event) => setNewUsername(event.target.value)}
      minLength={3}
      maxLength={20}
    />

    <button onClick={changeUsername}>
      Save
    </button>

    {usernameError && <p>{usernameError}</p>}
  </div>
)}
<div className="contacts">
  <h3>Add a contact</h3>

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

  <button onClick={searchForContact}>
    Search
  </button>

  {contactError && <p>{contactError}</p>}

  {searchResult && (
    <div>
      <strong>{searchResult.username}</strong>
      <button onClick={addContact}>Add contact</button>
    </div>
  )}

<div className="groups">
  <h3>Group chats</h3>

  <button onClick={() => {
    setShowGroupCreator(!showGroupCreator);
    setGroupError("");
  }}>
    + Create group
  </button>

  {showGroupCreator && (
    <div>
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

      <button onClick={createGroup}>
        Create
      </button>

      {groupError && <p>{groupError}</p>}
    </div>
  )}

  <h3>Your groups</h3>

  {groups.length === 0 ? (
    <p>No groups yet.</p>
  ) : (
    groups.map((group) => (
      <div
        className="contact-item"
        key={group.id}
        onClick={() => {
          setSelectedGroup(group);
          setSelectedContact(null);
        }}
      >
        <div className="avatar">
          {group.name.charAt(0).toUpperCase()}
        </div>

        <strong>{group.name}</strong>
      </div>
    ))
  )}
  {selectedGroup && (
  <div className="group-members">
    <h3>{selectedGroup.name} members</h3>

    {selectedGroup.created_by === user.id && (
  <div className="group-management">
    <button
  onClick={() => {
    setShowAddMembers(!showAddMembers);
    setMemberError("");
  }}
>{showAddMembers && (
  <div className="add-members">
    <h4>Add people to {selectedGroup.name}</h4>

    {contacts.length === 0 ? (
      <p>You don't have any contacts to add.</p>
    ) : (
      contacts.map((contact) => {
        const alreadyMember = groupMembers.some(
          (member) => member.user_id === contact.profiles.id
        );

        if (alreadyMember) return null;

        return (
          <div className="add-member-row" key={contact.id}>
            <span>{contact.profiles.username}</span>

            <button
              onClick={async () => {
                const { error } = await supabase
                  .from("group_members")
                  .insert({
                    group_id: selectedGroup.id,
                    user_id: contact.profiles.id,
                  });

                if (error) {
                  if (error.code === "23505") {
                    setMemberError(
                      "That person is already in the group."
                    );
                  } else {
                    console.error("Error adding member:", error);
                    setMemberError(error.message);
                  }
                  return;
                }

                const { data: updatedMembers, error: membersError } = await supabase
  .from("group_members")
  .select("id, user_id, profiles:profiles!group_members_user_id_fkey(id, username)")
  .eq("group_id", selectedGroup.id);

if (membersError) {
  console.error("Error refreshing group members:", membersError);
} else {
  setGroupMembers(updatedMembers || []);
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

    {memberError && <p>{memberError}</p>}
  </div>
)}
  {showAddMembers ? "Cancel" : "Add members"}
</button>
    <button
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
          console.error("Error deleting group:", error);
          setGroupError(error.message);
          return;
        }

        setGroups((currentGroups) =>
          currentGroups.filter((group) => group.id !== selectedGroup.id)
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

    {groupError && <p>{groupError}</p>}
  </div>
)}

{selectedGroup.created_by !== user.id && (
  <div className="group-management">
    <button
      onClick={async () => {
        const confirmed = window.confirm(
          `Leave "${selectedGroup.name}"?`
        );

        if (!confirmed) return;

        const { error } = await supabase
          .from("group_members")
          .delete()
          .eq("group_id", selectedGroup.id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error leaving group:", error);
          setGroupError(error.message);
          return;
        }

        setGroups((currentGroups) =>
          currentGroups.filter((group) => group.id !== selectedGroup.id)
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

    {groupError && <p>{groupError}</p>}
  </div>
)}

    {groupMembers.map((member) => (
      <div key={member.id} className="contact-item">
        <div className="avatar">
          {member.profile?.username?.charAt(0).toUpperCase() || "?"}
        </div>

        <strong>
          {member.profile?.username || "Unknown user"}
        </strong>
      </div>
    ))}
  </div>
)}
</div>

<h3>Your contacts</h3>

{contacts.length === 0 ? (
  <p>No contacts yet.</p>
) : (
  contacts.map((contact) => (
  <div
    className="contact-item"
    key={contact.id}
    onClick={async () => {
  setSelectedContact(contact.profiles);
  setSelectedGroup(null);

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", contact.profiles.id)
    .eq("recipient_id", user.id)
    .is("read_at", null);

  setUnreadCounts((current) => ({
    ...current,
    [contact.profiles.id]: 0,
  }));
}}
  >
    <div className="avatar">
      {contact.profiles.username.charAt(0).toUpperCase()}
    </div>

    <div className="contact-name-row">
  <strong>{contact.profiles.username}</strong>

  {unreadCounts[contact.profiles.id] > 0 && (
    <span className="unread-badge">
      {unreadCounts[contact.profiles.id]}
    </span>
  )}
</div>

<button
  onClick={(event) => {
    event.stopPropagation();
    removeContact(contact.contact_id);
  }}
>
  Remove
</button>

  </div>
))
)}

</div>
        <button onClick={logOut}>Log out</button>
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
      ? "Online"
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