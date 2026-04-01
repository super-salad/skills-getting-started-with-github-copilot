document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let messageHideTimeoutId;

  function showMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    if (messageHideTimeoutId !== undefined) {
      clearTimeout(messageHideTimeoutId);
    }

    messageHideTimeoutId = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch(`/activities?ts=${Date.now()}`, { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build activity card content safely using DOM APIs
        const titleEl = document.createElement("h4");
        titleEl.textContent = name;
        activityCard.appendChild(titleEl);

        const descriptionEl = document.createElement("p");
        descriptionEl.textContent = details.description;
        activityCard.appendChild(descriptionEl);

        const scheduleEl = document.createElement("p");
        const scheduleLabelEl = document.createElement("strong");
        scheduleLabelEl.textContent = "Schedule:";
        scheduleEl.appendChild(scheduleLabelEl);
        scheduleEl.appendChild(document.createTextNode(" " + details.schedule));
        activityCard.appendChild(scheduleEl);

        const availabilityEl = document.createElement("p");
        const availabilityLabelEl = document.createElement("strong");
        availabilityLabelEl.textContent = "Availability:";
        availabilityEl.appendChild(availabilityLabelEl);
        availabilityEl.appendChild(
          document.createTextNode(" " + spotsLeft + " spots left")
        );
        activityCard.appendChild(availabilityEl);

        const participantsSectionEl = document.createElement("div");
        participantsSectionEl.className = "participants-section";

        const participantsTitleEl = document.createElement("p");
        participantsTitleEl.className = "participants-title";
        const participantsTitleStrongEl = document.createElement("strong");
        participantsTitleStrongEl.textContent = "Participants:";
        participantsTitleEl.appendChild(participantsTitleStrongEl);
        participantsSectionEl.appendChild(participantsTitleEl);

        if (details.participants.length) {
          const participantsListEl = document.createElement("ul");
          participantsListEl.className = "participants-list";

          details.participants.forEach((participant) => {
            const participantItemEl = document.createElement("li");
            participantItemEl.className = "participant-item";

            const participantEmailEl = document.createElement("span");
            participantEmailEl.className = "participant-email";
            participantEmailEl.textContent = participant;
            participantItemEl.appendChild(participantEmailEl);

            const deleteButtonEl = document.createElement("button");
            deleteButtonEl.type = "button";
            deleteButtonEl.className = "participant-delete-btn";
            deleteButtonEl.dataset.activity = name;
            deleteButtonEl.dataset.email = participant;
            deleteButtonEl.setAttribute(
              "aria-label",
              `Remove ${participant} from ${name}`
            );
            deleteButtonEl.title = "Unregister participant";

            const deleteIconEl = document.createElement("span");
            deleteIconEl.setAttribute("aria-hidden", "true");
            deleteIconEl.textContent = "×";
            deleteButtonEl.appendChild(deleteIconEl);

            participantItemEl.appendChild(deleteButtonEl);
            participantsListEl.appendChild(participantItemEl);
          });

          participantsSectionEl.appendChild(participantsListEl);
        } else {
          const participantsEmptyEl = document.createElement("p");
          participantsEmptyEl.className = "participants-empty";
          participantsEmptyEl.textContent = "No participants yet.";
          participantsSectionEl.appendChild(participantsEmptyEl);
        }

        activityCard.appendChild(participantsSectionEl);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".participant-delete-btn");
    if (!deleteButton) {
      return;
    }

    const activity = deleteButton.dataset.activity;
    const email = deleteButton.dataset.email;

    if (!activity || !email) {
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "Failed to unregister participant.", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister participant. Please try again.", "error");
      console.error("Error unregistering participant:", error);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
