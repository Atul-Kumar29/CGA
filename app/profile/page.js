"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { logout } from "../auth";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
      } else {
        setUser(u);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  async function handleLogout() {
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  }

  // profile details state
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [education, setEducation] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // load existing details for the user
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const dref = doc(db, "users", user.uid);
        const snap = await getDoc(dref);
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || "");
          setAge(data.age ? String(data.age) : "");
          setEducation(data.education || "");
        }
      } catch (err) {
        console.error("Failed to load profile details", err);
      }
    };
    load();
  }, [user]);

  async function saveDetails(e) {
    e && e.preventDefault();
    if (!user) return router.push("/login");
    setSaving(true);
    setMessage(null);
    try {
      const dref = doc(db, "users", user.uid);
      await setDoc(
        dref,
        {
          name: name || null,
          age: age ? Number(age) : null,
          education: education || null,
          email: user.email || null,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setMessage("Profile saved.");
    } catch (err) {
      console.error("Failed to save profile details", err);
      setMessage("Failed to save profile: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Profile</h1>
      {user ? (
        <div className="mt-4 max-w-md">
          <p className="mb-2">Email: {user.email}</p>

          <form onSubmit={saveDetails} className="flex flex-col gap-2">
            <label className="text-sm">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-2 border rounded"
              placeholder="Your full name"
            />

            <label className="text-sm">Age</label>
            <input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="p-2 border rounded"
              placeholder="Age"
              type="number"
              min="0"
            />

            <label className="text-sm">Education</label>
            <input
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              className="p-2 border rounded"
              placeholder="Education / degree"
            />

            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-green-200 p-2 rounded"
              >
                {saving ? "Saving..." : "Save Details"}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="bg-red-200 p-2 rounded"
              >
                Sign out
              </button>

              <button
                type="button"
                onClick={() => router.push("/chatroom")}
                className="bg-blue-200 p-2 rounded"
              >
                Go to Chatroom
              </button>
            </div>
          </form>

          {message && (
            <div className="mt-2 bg-white p-2 text-sm">{message}</div>
          )}
        </div>
      ) : (
        <div>
          <p>No user found. Redirecting to login...</p>
        </div>
      )}
    </div>
  );
}