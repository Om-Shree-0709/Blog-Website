import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  User,
  FileText,
  MessageCircle,
  Bookmark,
  Heart,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Settings,
} from "lucide-react";

const API = `${process.env.REACT_APP_API_URL || "http://localhost:7777"}/admin`;

const TABS = [
  {
    key: "users",
    label: "Users",
    icon: <User className="inline h-5 w-5 mr-1" />,
  },
  {
    key: "posts",
    label: "Posts",
    icon: <FileText className="inline h-5 w-5 mr-1" />,
  },
  {
    key: "comments",
    label: "Comments",
    icon: <MessageCircle className="inline h-5 w-5 mr-1" />,
  },
  {
    key: "likes",
    label: "Likes",
    icon: <Heart className="inline h-5 w-5 mr-1 text-red-500" />,
  },
  {
    key: "bookmarks",
    label: "Bookmarks",
    icon: <Bookmark className="inline h-5 w-5 mr-1 text-indigo-500" />,
  },
];

function AdminDashboard() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [modal, setModal] = useState(null);
  const [likes, setLikes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  const token = localStorage.getItem("token");

  // Fetch data for each tab
  const fetchData = async () => {
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const fetchOptions = {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      if (["users", "posts", "comments"].includes(tab)) {
        const endpoints = {
          users: `${API}/users`,
          posts: `${API}/posts`,
          comments: `${API}/comments`,
        };
        const [usersRes, postsRes, commentsRes] = await Promise.all([
          fetch(endpoints.users, fetchOptions),
          fetch(endpoints.posts, fetchOptions),
          fetch(endpoints.comments, fetchOptions),
        ]);
        if (!usersRes.ok)
          throw new Error(
            `Failed to fetch users: ${usersRes.status} ${usersRes.statusText}`
          );
        if (!postsRes.ok)
          throw new Error(
            `Failed to fetch posts: ${postsRes.status} ${postsRes.statusText}`
          );
        if (!commentsRes.ok)
          throw new Error(
            `Failed to fetch comments: ${commentsRes.status} ${commentsRes.statusText}`
          );
        const usersData = await usersRes.json();
        const postsData = await postsRes.json();
        const commentsData = await commentsRes.json();
        setUsers(usersData.users || []);
        setPosts(postsData.posts || []);
        setComments(commentsData.comments || []);
      } else if (tab === "likes") {
        // Likes: fetch posts and comments in parallel
        const [postRes, commentRes] = await Promise.all([
          fetch(`${API}/posts`, fetchOptions),
          fetch(`${API}/comments`, fetchOptions),
        ]);
        if (!postRes.ok)
          throw new Error(
            `Failed to fetch posts for likes: ${postRes.status} ${postRes.statusText}`
          );
        if (!commentRes.ok)
          throw new Error(
            `Failed to fetch comments for likes: ${commentRes.status} ${commentRes.statusText}`
          );
        const postData = await postRes.json();
        const commentData = await commentRes.json();
        let allLikes = [];
        (postData.posts || []).forEach((p) => {
          (p.likes || []).forEach((userId) => {
            allLikes.push({
              _id: `${p._id}-${userId}`,
              type: "post",
              user: userId,
              post: p,
            });
          });
        });
        (commentData.comments || []).forEach((c) => {
          (c.likes || []).forEach((userId) => {
            allLikes.push({
              _id: `${c._id}-${userId}`,
              type: "comment",
              user: userId,
              comment: c,
            });
          });
        });
        setLikes(allLikes);
      } else if (tab === "bookmarks") {
        const userRes = await fetch(`${API}/users`, fetchOptions);
        if (!userRes.ok)
          throw new Error(
            `Failed to fetch users for bookmarks: ${userRes.status} ${userRes.statusText}`
          );
        const userData = await userRes.json();
        let allBookmarks = [];
        (userData.users || []).forEach((u) => {
          (u.bookmarks || []).forEach((postId) => {
            allBookmarks.push({ _id: `${u._id}-${postId}`, user: u, postId });
          });
        });
        setBookmarks(allBookmarks);
      }
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to fetch data");
      setLoading(false);
      console.error("AdminDashboard fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    setEditId(null);
    setEditData({});
    // eslint-disable-next-line
  }, [tab]);

  // Edit, Save, Cancel, Delete logic (same as before, but with modals)
  const handleEdit = (item) => {
    setEditId(item._id);
    setEditData(item);
    setModal({ type: "edit", id: item._id, data: item });
  };
  const handleCancelEdit = () => {
    setEditId(null);
    setEditData({});
    setModal(null);
  };
  const handleSaveEdit = async (type) => {
    let url = "";
    if (type === "users") url = `${API}/users/${editId}`;
    if (type === "posts") url = `${API}/posts/${editId}`;
    if (type === "comments") url = `${API}/comments/${editId}`;
    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Updated successfully");
      fetchData();
      setEditId(null);
      setEditData({});
      setModal(null);
    } catch (err) {
      toast.error("Update failed");
    }
  };
  const handleDelete = async (type, id) => {
    setModal({ type: "delete", id });
  };
  const confirmDelete = async (type, id) => {
    let url = "";
    if (type === "users") url = `${API}/users/${id}`;
    if (type === "posts") url = `${API}/posts/${id}`;
    if (type === "comments") url = `${API}/comments/${id}`;
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Deleted successfully");
      fetchData();
      setModal(null);
    } catch (err) {
      toast.error("Delete failed");
    }
  };
  const handleInputChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  // Admin like/bookmark management
  const handleRemoveLike = async (like) => {
    let url = "";
    if (like.type === "post")
      url = `${API}/posts/${like.post._id}/like/${like.user}`;
    if (like.type === "comment")
      url = `${API}/comments/${like.comment._id}/like/${like.user}`;
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      toast.success("Like removed");
      fetchData();
    } catch {
      toast.error("Failed to remove like");
    }
  };
  const handleRemoveBookmark = async (bm) => {
    let url = `${API}/users/${bm.user._id}/bookmark/${bm.postId}`;
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      toast.success("Bookmark removed");
      fetchData();
    } catch {
      toast.error("Failed to remove bookmark");
    }
  };

  // Modal UI
  const renderModal = () => {
    if (!modal) return null;
    if (modal.type === "edit") {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Edit className="h-5 w-5 mr-2" />
              Edit {tab.slice(0, -1)}
            </h3>
            {tab === "users" && (
              <>
                <label className="block mb-2">Username</label>
                <input
                  name="username"
                  value={editData.username || ""}
                  onChange={handleInputChange}
                  className="w-full border px-2 py-1 rounded mb-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
                <label className="block mb-2">Email</label>
                <input
                  name="email"
                  value={editData.email || ""}
                  onChange={handleInputChange}
                  className="w-full border px-2 py-1 rounded mb-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
                <label className="block mb-2">Role</label>
                <select
                  name="role"
                  value={editData.role || "reader"}
                  onChange={handleInputChange}
                  className="w-full border px-2 py-1 rounded mb-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="admin">admin</option>
                  <option value="author">author</option>
                  <option value="reader">reader</option>
                </select>
              </>
            )}
            {tab === "posts" && (
              <>
                <label className="block mb-2">Title</label>
                <input
                  name="title"
                  value={editData.title || ""}
                  onChange={handleInputChange}
                  className="w-full border px-2 py-1 rounded mb-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </>
            )}
            {tab === "comments" && (
              <>
                <label className="block mb-2">Content</label>
                <input
                  name="content"
                  value={editData.content || ""}
                  onChange={handleInputChange}
                  className="w-full border px-2 py-1 rounded mb-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded flex items-center"
                onClick={() => handleSaveEdit(tab)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Save
              </button>
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded flex items-center"
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    }
    if (modal.type === "delete") {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-4 flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Confirm Delete
            </h3>
            <p className="mb-4">
              Are you sure you want to delete this {tab.slice(0, -1)}?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-red-600 text-white rounded flex items-center"
                onClick={() => confirmDelete(tab, modal.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded flex items-center"
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Settings className="h-7 w-7 mr-2 text-indigo-600" />
        Admin Dashboard
      </h1>
      <div className="flex gap-2 mb-8 border-b pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center px-4 py-2 rounded-t-lg border-b-2 transition-all ${
              tab === t.key
                ? "border-indigo-600 bg-indigo-50 dark:bg-gray-900 font-bold"
                : "border-transparent bg-gray-100 dark:bg-gray-800"
            }`}
            title={t.label}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
      {loading && <div>Loading...</div>}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      {tab === "users" && (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-lg shadow-sm bg-white dark:bg-gray-900">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="border px-2 py-2">ID</th>
                <th className="border px-2 py-2">Username</th>
                <th className="border px-2 py-2">Email</th>
                <th className="border px-2 py-2">Role</th>
                <th className="border px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u._id}
                  className="hover:bg-indigo-50 dark:hover:bg-gray-800"
                >
                  <td className="border px-2 py-1 text-xs">{u._id}</td>
                  <td className="border px-2 py-1">{u.username}</td>
                  <td className="border px-2 py-1">{u.email}</td>
                  <td className="border px-2 py-1 capitalize">{u.role}</td>
                  <td className="border px-2 py-1">
                    <button
                      className="text-blue-600 hover:underline mr-2"
                      title="Edit"
                      onClick={() => handleEdit(u)}
                    >
                      <Edit className="h-4 w-4 inline" />
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      title="Delete"
                      onClick={() => handleDelete("users", u._id)}
                    >
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "posts" && (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-lg shadow-sm bg-white dark:bg-gray-900">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="border px-2 py-2">ID</th>
                <th className="border px-2 py-2">Title</th>
                <th className="border px-2 py-2">Author</th>
                <th className="border px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr
                  key={p._id}
                  className="hover:bg-indigo-50 dark:hover:bg-gray-800"
                >
                  <td className="border px-2 py-1 text-xs">{p._id}</td>
                  <td className="border px-2 py-1">{p.title}</td>
                  <td className="border px-2 py-1">
                    {p.author?.username || "-"}
                  </td>
                  <td className="border px-2 py-1">
                    <button
                      className="text-blue-600 hover:underline mr-2"
                      title="Edit"
                      onClick={() => handleEdit(p)}
                    >
                      <Edit className="h-4 w-4 inline" />
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      title="Delete"
                      onClick={() => handleDelete("posts", p._id)}
                    >
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "comments" && (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-lg shadow-sm bg-white dark:bg-gray-900">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="border px-2 py-2">ID</th>
                <th className="border px-2 py-2">Content</th>
                <th className="border px-2 py-2">Author</th>
                <th className="border px-2 py-2">Post</th>
                <th className="border px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((c) => (
                <tr
                  key={c._id}
                  className="hover:bg-indigo-50 dark:hover:bg-gray-800"
                >
                  <td className="border px-2 py-1 text-xs">{c._id}</td>
                  <td className="border px-2 py-1">{c.content}</td>
                  <td className="border px-2 py-1">
                    {c.author?.username || "-"}
                  </td>
                  <td className="border px-2 py-1">{c.post?.title || "-"}</td>
                  <td className="border px-2 py-1">
                    <button
                      className="text-blue-600 hover:underline mr-2"
                      title="Edit"
                      onClick={() => handleEdit(c)}
                    >
                      <Edit className="h-4 w-4 inline" />
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      title="Delete"
                      onClick={() => handleDelete("comments", c._id)}
                    >
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "likes" && (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-lg shadow-sm bg-white dark:bg-gray-900">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="border px-2 py-2">Type</th>
                <th className="border px-2 py-2">User ID</th>
                <th className="border px-2 py-2">Post/Comment</th>
                <th className="border px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {likes.map((l) => (
                <tr
                  key={l._id}
                  className="hover:bg-indigo-50 dark:hover:bg-gray-800"
                >
                  <td className="border px-2 py-1 capitalize">{l.type}</td>
                  <td className="border px-2 py-1">{l.user}</td>
                  <td className="border px-2 py-1">
                    {l.type === "post" ? l.post.title : l.comment.content}
                  </td>
                  <td className="border px-2 py-1">
                    <button
                      className="text-red-600 hover:underline"
                      title="Remove Like"
                      onClick={() => handleRemoveLike(l)}
                    >
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "bookmarks" && (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-lg shadow-sm bg-white dark:bg-gray-900">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="border px-2 py-2">User</th>
                <th className="border px-2 py-2">Post ID</th>
                <th className="border px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookmarks.map((b) => (
                <tr
                  key={b._id}
                  className="hover:bg-indigo-50 dark:hover:bg-gray-800"
                >
                  <td className="border px-2 py-1">{b.user.username}</td>
                  <td className="border px-2 py-1">{b.postId}</td>
                  <td className="border px-2 py-1">
                    <button
                      className="text-red-600 hover:underline"
                      title="Remove Bookmark"
                      onClick={() => handleRemoveBookmark(b)}
                    >
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {renderModal()}
    </div>
  );
}

export default AdminDashboard;
