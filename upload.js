
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert("Please log in to convert files.");
    window.location.href = "/login.html";
    return;
  }

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/login.html";
  });

  const form = document.getElementById("upload-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = document.getElementById("file").files[0];
    const format = document.getElementById("format").value;
    const errorDisplay = document.getElementById("upload-error");

    if (!file || !format) {
      errorDisplay.textContent = "Please select a file and format.";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("format", format);
    formData.append("userId", session.user.id);

    const response = await fetch("/api/convert", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (result.error) {
      errorDisplay.textContent = result.error;
    } else if (result.downloadUrl) {
      window.location.href = result.downloadUrl;
    } else {
      errorDisplay.textContent = "Unexpected error. Try again.";
    }
  });
});
