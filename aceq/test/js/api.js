const API_BASE =
  window.APP_CONFIG?.apiBase || "https://studymental.kimsoosuk1.workers.dev";
// const API_BASE = window.APP_CONFIG?.apiBase || "http://127.0.0.1:8787";

export const api = {
  getAuthToken() {
    return localStorage.getItem("aceq_admin_pw") || "";
  },

  async saveResult(payload) {
    const res = await fetch(`${API_BASE}/api/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`saveResult ${res.status}`);
    return res.json();
  },

  async getResult(resultId) {
    const res = await fetch(`${API_BASE}/api/results/${resultId}`, {
      headers: { "Authorization": this.getAuthToken() }
    });
    if (!res.ok) throw new Error(`getResult ${res.status}`);
    return res.json();
  },

  async generateReport(payload) {
    const res = await fetch(`${API_BASE}/api/report`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": this.getAuthToken()
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`generateReport ${res.status}`);
    return res.json();
  },

  async getAdminResults() {
    const res = await fetch(`${API_BASE}/api/admin/results`, {
      headers: { "Authorization": this.getAuthToken() }
    });
    if (!res.ok) throw new Error(`getAdminResults ${res.status}`);
    return res.json();
  },

  async deleteResult(resultId) {
    const res = await fetch(`${API_BASE}/api/results/${resultId}`, {
      method: "DELETE",
      headers: { "Authorization": this.getAuthToken() }
    });
    if (!res.ok) throw new Error(`deleteResult ${res.status}`);
    return res.json();
  },
};
