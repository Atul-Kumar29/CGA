"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function ProductsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
      } else {
        setUser(u);
      }
      setLoading(false);
    });
    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
    });
    return () => unsub();
  }, []);

  async function addProduct(e) {
    e.preventDefault();
    if (!user) return router.push("/login");
    if (!name.trim()) return alert("Please enter a product name");
    setSaving(true);
    try {
      await addDoc(collection(db, "products"), {
        name: name.trim(),
        description: description.trim() || null,
        price: price ? Number(price) : null,
        ownerUid: user.uid,
        ownerEmail: user.email || null,
        createdAt: serverTimestamp(),
      });
      setName("");
      setDescription("");
      setPrice("");
    } catch (err) {
      console.error("addProduct error", err);
      alert("Failed to add product: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8">Checking authentication...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Products</h1>

      <form onSubmit={addProduct} className="mt-4 flex flex-col gap-2 max-w-md">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 border rounded"
          placeholder="Product name"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-2 border rounded"
          placeholder="Short description"
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="p-2 border rounded"
          placeholder="Price (optional)"
          type="number"
          min="0"
        />
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="bg-green-200 p-2 rounded">
            {saving ? "Adding..." : "Add Product"}
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {products.length === 0 ? (
          <p className="text-gray-500">No products yet.</p>
        ) : (
          products.map((p) => (
            <div key={p.id} className="p-4 border rounded bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-gray-600">{p.description}</div>
                  <div className="text-sm text-gray-800 mt-1">Price: {p.price ?? "N/A"}</div>
                  <div className="text-xs text-gray-500">Owner: {p.ownerEmail || p.ownerUid}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => router.push(`/chatroom?productId=${p.id}`)}
                    className="bg-blue-200 p-2 rounded text-sm"
                  >
                    Further queries
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
