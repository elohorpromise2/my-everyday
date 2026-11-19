"use strict";

/* =========================================================
   MY EVERYDAY
   Personal Organisation Application
   Main JavaScript
========================================================= */


/* =========================================================
   1. STORAGE AND DEFAULT DATA
========================================================= */

const STORAGE_KEY = "myEverydayData";

const DEFAULT_DATA = {
    activities: [],
    timetable: [],
    courses: [],
    assignments: [],
    spiritual: [],
    people: [],
    partnerMessages: [],
    journal: [],
    goals: [],

    settings: {
        displayName: "",
        weekStart: "Monday"
    },

    notified: []
};


/* =========================================================
   2. GENERAL HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

function listen(id, event, callback) {
    const element = $(id);

    if (element) {
        element.addEventListener(event, callback);
    }

    return element;
}

function generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];
    });
}

function todayString() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(value) {
    if (!value) {
        return "No date selected";
    }

    const parts = String(value).split("-").map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
        return "Invalid date";
    }

    const date = new Date(parts[0], parts[1] - 1, parts[2]);

    if (Number.isNaN(date.getTime())) {
        return "Invalid date";
    }

    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function formatShortDate(value) {
    if (!value) {
        return "";
    }

    const parts = value.split("-").map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
        return "";
    }

    const date = new Date(parts[0], parts[1] - 1, parts[2]);

    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short"
    });
}

function formatTime(value) {
    if (!value) {
        return "";
    }

    const parts = value.split(":");

    if (parts.length !== 2) {
        return value;
    }

    let hours = Number(parts[0]);
    const minutes = parts[1];

    if (Number.isNaN(hours)) {
        return value;
    }

    const period = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return `${hours}:${minutes} ${period}`;
}

function normalizeClass(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function sortByDate(items, property = "date") {
    return [...items].sort((a, b) => {
        return String(a[property] || "9999-99-99")
            .localeCompare(String(b[property] || "9999-99-99"));
    });
}

function setText(id, value) {
    const element = $(id);

    if (element) {
        element.textContent = value;
    }
}

function setValue(id, value) {
    const element = $(id);

    if (element) {
        element.value = value ?? "";
    }
}

function getValue(id) {
    return $(id)?.value?.trim() || "";
}


/* =========================================================
   3. LOAD AND NORMALISE SAVED DATA
========================================================= */

function createDefaultData() {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return createDefaultData();
        }

        const parsed = JSON.parse(saved);

        const loaded = {
            ...createDefaultData(),
            ...parsed,

            settings: {
                ...DEFAULT_DATA.settings,
                ...(parsed.settings || {})
            }
        };

        const arrayProperties = [
            "activities",
            "timetable",
            "courses",
            "assignments",
            "spiritual",
            "people",
            "partnerMessages",
            "journal",
            "goals",
            "notified"
        ];

        arrayProperties.forEach(property => {
            if (!Array.isArray(loaded[property])) {
                loaded[property] = [];
            }
        });

        loaded.people = loaded.people.map(person => ({
            ...person,

            birthday: person.birthday || "",
            phone: person.phone || person.contact || "",
            email: person.email || "",
            contactMethod: person.contactMethod || "",
            address: person.address || "",
            contactTime: person.contactTime || "",
            frequency: person.frequency || "",
            lastContacted: person.lastContacted || "",
            reminder: person.reminder || "None",
            reminderTime: person.reminderTime || "",
            birthdayReminder: person.birthdayReminder || "Yes",
            importantDates: person.importantDates || "",
            notes: person.notes || ""
        }));

        return loaded;

    } catch (error) {
        console.error("Could not load My Everyday data:", error);
        return createDefaultData();
    }
}

let data = loadData();
let messageTimer;


/* =========================================================
   4. SAVE DATA
========================================================= */

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;

    } catch (error) {
        console.error("Could not save My Everyday data:", error);

        showMessage(
            "Your browser could not save the information. Check your available storage.",
            "error"
        );

        return false;
    }
}


/* =========================================================
   5. MESSAGE AND FEEDBACK SYSTEM
========================================================= */

function showMessage(message, type = "success") {
    const messageElement = $("message");

    if (!messageElement) {
        return;
    }

    clearTimeout(messageTimer);

    messageElement.textContent = message;
    messageElement.className = `message-area show ${type}`;

    messageTimer = setTimeout(() => {
        messageElement.className = "message-area";
        messageElement.textContent = "";
    }, 4000);
}


/* =========================================================
   6. NAVIGATION
========================================================= */

const PAGE_NAMES = {
    today: "Today",
    planner: "Planner",
    timetable: "Weekly Timetable",
    school: "School",
    spiritual: "Spiritual Growth",
    people: "People & Birthdays",
    partner: "Message Your Partner",
    journal: "Journal",
    goals: "My Goals",
    settings: "Settings"
};

function showPage(pageName) {
    if (!PAGE_NAMES[pageName]) {
        return;
    }

    document.querySelectorAll(".page-section").forEach(section => {
        section.classList.toggle("active", section.id === pageName);
    });

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    setText("pageTitle", PAGE_NAMES[pageName]);

    closeMobileMenu();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    renderDashboard();
}

document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.go);
    });
});


/* =========================================================
   7. MOBILE SIDEBAR
========================================================= */

function createSidebarOverlay() {
    let overlay = document.querySelector(".sidebar-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "sidebar-overlay";
        document.body.appendChild(overlay);
    }

    overlay.addEventListener("click", closeMobileMenu);

    return overlay;
}

const sidebarOverlay = createSidebarOverlay();

function openMobileMenu() {
    $("sidebar")?.classList.add("open");
    sidebarOverlay.classList.add("show");
}

function closeMobileMenu() {
    $("sidebar")?.classList.remove("open");
    sidebarOverlay.classList.remove("show");
}

listen("menuButton", "click", () => {
    const sidebar = $("sidebar");

    if (sidebar?.classList.contains("open")) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
});


/* =========================================================
   8. GENERAL RECORD HELPERS
========================================================= */

function findRecord(type, id) {
    const collection = data[type];

    if (!Array.isArray(collection)) {
        return null;
    }

    return collection.find(record => record.id === id) || null;
}

function saveRecord(type, record) {
    if (!Array.isArray(data[type])) {
        data[type] = [];
    }

    const existingIndex = data[type].findIndex(
        item => item.id === record.id
    );

    if (existingIndex >= 0) {
        data[type][existingIndex] = record;
    } else {
        data[type].push(record);
    }

    return saveData();
}

function statusBadge(status) {
    const safeStatus = escapeHTML(status || "Not Started");
    const className = normalizeClass(status);

    return `
        <span class="status-badge ${className}">
            ${safeStatus}
        </span>
    `;
}

function categoryBadge(category) {
    if (!category) {
        return "";
    }

    return `
        <span class="category-badge">
            ${escapeHTML(category)}
        </span>
    `;
}

function priorityBadge(priority) {
    if (!priority) {
        return "";
    }

    return `
        <span class="priority-badge ${normalizeClass(priority)}">
            ${escapeHTML(priority)}
        </span>
    `;
}

function actionButton(action, type, id, label, extraClass = "") {
    return `
        <button
            type="button"
            class="action-button ${extraClass}"
            data-action="${escapeHTML(action)}"
            data-type="${escapeHTML(type)}"
            data-id="${escapeHTML(id)}">
            ${escapeHTML(label)}
        </button>
    `;
}

function renderEmpty(message) {
    return `<p class="empty-state">${escapeHTML(message)}</p>`;
}

function recordActions(type, id, options = {}) {
    const buttons = [];

    if (options.toggle) {
        buttons.push(
            actionButton(
                "toggle",
                type,
                id,
                options.toggle.label,
                options.toggle.className || "complete"
            )
        );
    }

    if (options.copy) {
        buttons.push(
            actionButton("copy", type, id, "Copy")
        );
    }

    buttons.push(actionButton("edit", type, id, "Edit"));
    buttons.push(actionButton("delete", type, id, "Delete", "delete"));

    return `<div class="record-actions">${buttons.join("")}</div>`;
}

function recordItem(title, description, metadata, actions, extraClass = "") {
    return `
        <article class="record-item ${extraClass}">
            <div class="record-main">
                <div class="record-content">
                    <h4>${escapeHTML(title)}</h4>

                    ${description ? `
                        <p class="record-description">
                            ${escapeHTML(description)}
                        </p>
                    ` : ""}

                    ${metadata ? `
                        <div class="record-meta">${metadata}</div>
                    ` : ""}
                </div>
            </div>

            ${actions || ""}
        </article>
    `;
}


/* =========================================================
   9. FORM EDITING HELPERS
========================================================= */

const FORM_CONFIG = {
    activities: {
        form: "activityForm",
        hidden: "activityId",
        submit: "activitySubmit",
        cancel: "activityCancel",
        defaultText: "Save Activity"
    },

    timetable: {
        form: "timetableForm",
        hidden: "timetableId",
        submit: "timetableSubmit",
        cancel: "timetableCancel",
        defaultText: "Save Timetable Entry"
    },

    courses: {
        form: "courseForm",
        hidden: "courseId",
        submit: "courseSubmit",
        cancel: "courseCancel",
        defaultText: "Save Course"
    },

    assignments: {
        form: "assignmentForm",
        hidden: "assignmentId",
        submit: "assignmentSubmit",
        cancel: "assignmentCancel",
        defaultText: "Save Assignment"
    },

    spiritual: {
        form: "spiritualForm",
        hidden: "spiritualId",
        submit: "spiritualSubmit",
        cancel: "spiritualCancel",
        defaultText: "Save Reflection"
    },

    people: {
        form: "peopleForm",
        hidden: "personId",
        submit: "personSubmit",
        cancel: "personCancel",
        defaultText: "Save Person"
    },

    partnerMessages: {
        form: "partnerMessageForm",
        hidden: "partnerMessageId",
        submit: "partnerMessageSubmit",
        cancel: "partnerMessageCancel",
        defaultText: "Save Message"
    },

    journal: {
        form: "journalForm",
        hidden: "journalId",
        submit: "journalSubmit",
        cancel: "journalCancel",
        defaultText: "Save Journal Entry"
    },

    goals: {
        form: "goalForm",
        hidden: "goalId",
        submit: "goalSubmit",
        cancel: "goalCancel",
        defaultText: "Save Goal"
    }
};

function resetRecordForm(type) {
    const config = FORM_CONFIG[type];

    if (!config) {
        return;
    }

    $(config.form)?.reset();

    setValue(config.hidden, "");

    const submitButton = $(config.submit);

    if (submitButton) {
        submitButton.textContent = config.defaultText;
    }

    const cancelButton = $(config.cancel);

    if (cancelButton) {
        cancelButton.hidden = true;
    }

    if (type === "activities") {
        setValue("activityDate", todayString());
    }

    if (type === "assignments") {
        setValue("assignmentDate", todayString());
    }

    if (type === "spiritual") {
        setValue("spiritualDate", todayString());
    }

    if (type === "journal") {
        setValue("journalDate", todayString());
    }

    if (type === "goals") {
        setValue("goalProgress", "0");
    }
}

function setEditingMode(type, id) {
    const config = FORM_CONFIG[type];

    if (!config) {
        return;
    }

    setValue(config.hidden, id);

    const submitButton = $(config.submit);

    if (submitButton) {
        submitButton.textContent = "Update";
    }

    const cancelButton = $(config.cancel);

    if (cancelButton) {
        cancelButton.hidden = false;
    }
}

function populateForm(type, record, fields) {
    fields.forEach(([fieldName, inputId]) => {
        setValue(inputId, record[fieldName] ?? "");
    });

    setEditingMode(type, record.id);

    const config = FORM_CONFIG[type];

    if (config) {
        $(config.form)?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


/* =========================================================
   10. ACTIVITY PLANNER
========================================================= */

function renderActivities() {
    const container = $("activityList");

    if (!container) {
        return;
    }

    const search = getValue("activitySearch").toLowerCase();

    const activities = sortByDate(data.activities).filter(activity => {
        const text = [
            activity.title,
            activity.category,
            activity.notes
        ].join(" ").toLowerCase();

        return text.includes(search);
    });

    if (!activities.length) {
        container.innerHTML = renderEmpty(
            search ? "No matching activities found." : "No activities added yet."
        );
        return;
    }

    container.innerHTML = activities.map(activity => {
        const completed = Boolean(activity.completed);

        const metadata = `
            <span>${formatDate(activity.date)}</span>
            ${activity.time ? `<span>${formatTime(activity.time)}</span>` : ""}
            ${categoryBadge(activity.category)}
            ${priorityBadge(activity.priority)}
            ${statusBadge(completed ? "Completed" : "In Progress")}
        `;

        const actions = recordActions("activities", activity.id, {
            toggle: {
                label: completed ? "Undo" : "Complete"
            }
        });

        return recordItem(
            activity.title,
            activity.notes,
            metadata,
            actions
        );
    }).join("");
}

listen("activitySearch", "input", renderActivities);

listen("activityCancel", "click", () => {
    resetRecordForm("activities");
});

listen("activityForm", "submit", event => {
    event.preventDefault();

    const id = getValue("activityId") || generateId();

    const activity = {
        id,
        title: getValue("activityTitle"),
        date: getValue("activityDate"),
        time: getValue("activityTime"),
        category: getValue("activityCategory"),
        priority: getValue("activityPriority"),
        notes: getValue("activityNotes"),
        completed: findRecord("activities", id)?.completed || false
    };

    if (!activity.title || !activity.date) {
        showMessage("Please enter an activity title and date.", "error");
        return;
    }

    if (saveRecord("activities", activity)) {
        resetRecordForm("activities");
        renderAll();
        showMessage("Activity saved successfully.");
    }
});


/* =========================================================
   11. WEEKLY TIMETABLE
========================================================= */

const WEEK_DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
];

function getDayOrder() {
    if (data.settings.weekStart === "Sunday") {
        return [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ];
    }

    return WEEK_DAYS;
}

function renderTimetable() {
    const container = $("timetableList");

    if (!container) {
        return;
    }

    if (!data.timetable.length) {
        container.innerHTML = renderEmpty(
            "Your timetable will appear here."
        );
        return;
    }

    const days = getDayOrder();

    container.innerHTML = days.map(day => {
        const entries = data.timetable
            .filter(item => item.day === day)
            .sort((a, b) => a.start.localeCompare(b.start));

        if (!entries.length) {
            return "";
        }

        return `
            <div class="timetable-day">
                <div class="timetable-day-heading">
                    <span>${day}</span>
                    <span>${entries.length} ${entries.length === 1 ? "activity" : "activities"}</span>
                </div>

                ${entries.map(entry => `
                    <div class="timetable-entry">
                        <div class="timetable-time">
                            ${formatTime(entry.start)}
                            <br>
                            –
                            <br>
                            ${formatTime(entry.end)}
                        </div>

                        <div class="timetable-details">
                            <strong>${escapeHTML(entry.subject)}</strong>

                            ${entry.location ? `
                                <p>${escapeHTML(entry.location)}</p>
                            ` : ""}

                            <div class="record-actions">
                                ${actionButton("edit", "timetable", entry.id, "Edit")}
                                ${actionButton("delete", "timetable", entry.id, "Delete", "delete")}
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
    }).join("");

    if (!container.innerHTML.trim()) {
        container.innerHTML = renderEmpty(
            "There are no timetable entries yet."
        );
    }
}

listen("timetableCancel", "click", () => {
    resetRecordForm("timetable");
});

listen("timetableForm", "submit", event => {
    event.preventDefault();

    const id = getValue("timetableId") || generateId();

    const entry = {
        id,
        day: getValue("timetableDay"),
        subject: getValue("timetableSubject"),
        start: getValue("timetableStart"),
        end: getValue("timetableEnd"),
        location: getValue("timetableLocation")
    };

    if (!entry.subject || !entry.start || !entry.end) {
        showMessage("Please complete the timetable details.", "error");
        return;
    }

    if (entry.end <= entry.start) {
        showMessage("The ending time must be later than the starting time.", "error");
        return;
    }

    if (saveRecord("timetable", entry)) {
        resetRecordForm("timetable");
        renderAll();
        showMessage("Timetable entry saved.");
    }
});


/* =========================================================
   12. SCHOOL COURSES
========================================================= */

function renderCourses() {
    const container = $("courseList");

    if (!container) {
        return;
    }

    if (!data.courses.length) {
        container.innerHTML = renderEmpty("Your courses will appear here.");
        return;
    }

    container.innerHTML = data.courses.map(course => {
        const metadata = `
            <span>Code: ${escapeHTML(course.code)}</span>
            <span>${escapeHTML(course.credits)} credits</span>
            ${statusBadge(course.status)}
        `;

        return recordItem(
            course.name,
            "",
            metadata,
            recordActions("courses", course.id)
        );
    }).join("");
}

listen("courseCancel", "click", () => {
    resetRecordForm("courses");
});

listen("courseForm", "submit", event => {
    event.preventDefault();

    const id = getValue("courseId") || generateId();

    const course = {
        id,
        name: getValue("courseName"),
        code: getValue("courseCode"),
        credits: Number(getValue("courseCredits")) || 0,
        status: getValue("courseStatus")
    };

    if (!course.name || !course.code) {
        showMessage("Please enter the course name and code.", "error");
        return;
    }

    if (saveRecord("courses", course)) {
        resetRecordForm("courses");
        renderAll();
        showMessage("Course saved successfully.");
    }
});


/* =========================================================
   13. SCHOOL ASSIGNMENTS
========================================================= */

function renderAssignments() {
    const container = $("assignmentList");

    if (!container) {
        return;
    }

    const assignments = sortByDate(data.assignments);

    if (!assignments.length) {
        container.innerHTML = renderEmpty(
            "Your assignments will appear here."
        );
        return;
    }

    container.innerHTML = assignments.map(assignment => {
        const metadata = `
            ${assignment.course ? `<span>${escapeHTML(assignment.course)}</span>` : ""}
            <span>Due: ${formatDate(assignment.date)}</span>
            ${statusBadge(assignment.status)}
            ${priorityBadge(assignment.priority)}
        `;

        return recordItem(
            assignment.title,
            assignment.notes,
            metadata,
            recordActions("assignments", assignment.id, {
                toggle: {
                    label: assignment.status === "Completed" ? "Reopen" : "Complete"
                }
            })
        );
    }).join("");
}

listen("assignmentCancel", "click", () => {
    resetRecordForm("assignments");
});

listen("assignmentForm", "submit", event => {
    event.preventDefault();

    const id = getValue("assignmentId") || generateId();

    const assignment = {
        id,
        title: getValue("assignmentTitle"),
        course: getValue("assignmentCourse"),
        date: getValue("assignmentDate"),
        status: getValue("assignmentStatus"),
        priority: getValue("assignmentPriority"),
        notes: getValue("assignmentNotes")
    };

    if (!assignment.title || !assignment.date) {
        showMessage("Please enter an assignment title and due date.", "error");
        return;
    }

    if (saveRecord("assignments", assignment)) {
        resetRecordForm("assignments");
        renderAll();
        showMessage("Assignment saved successfully.");
    }
});


/* =========================================================
   14. SPIRITUAL GROWTH
========================================================= */

function renderSpiritual() {
    const container = $("spiritualList");

    if (!container) {
        return;
    }

    const entries = [...data.spiritual].sort((a, b) => {
        return String(b.date).localeCompare(String(a.date));
    });

    if (!entries.length) {
        container.innerHTML = renderEmpty(
            "Your spiritual records will appear here."
        );
        return;
    }

    container.innerHTML = entries.map(entry => {
        const metadata = `
            <span>${formatDate(entry.date)}</span>
            ${categoryBadge(entry.type)}
        `;

        return recordItem(
            entry.title || entry.type,
            entry.content,
            metadata,
            recordActions("spiritual", entry.id)
        );
    }).join("");
}

listen("spiritualCancel", "click", () => {
    resetRecordForm("spiritual");
});

listen("spiritualForm", "submit", event => {
    event.preventDefault();

    const id = getValue("spiritualId") || generateId();

    const entry = {
        id,
        type: getValue("spiritualType"),
        date: getValue("spiritualDate"),
        title: getValue("spiritualTitle"),
        content: getValue("spiritualContent")
    };

    if (!entry.content || !entry.date) {
        showMessage("Please enter a date and reflection.", "error");
        return;
    }

    if (saveRecord("spiritual", entry)) {
        resetRecordForm("spiritual");
        renderAll();
        showMessage("Spiritual reflection saved.");
    }
});


/* =========================================================
   15. PEOPLE AND CONTACT MANAGEMENT
========================================================= */

function renderPeople() {
    const container = $("peopleList");

    if (!container) {
        return;
    }

    const search = getValue("peopleSearch").toLowerCase();

    const people = [...data.people]
        .filter(person => {
            const text = [
                person.name,
                person.relationship,
                person.phone,
                person.email,
                person.notes
            ].join(" ").toLowerCase();

            return text.includes(search);
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    if (!people.length) {
        container.innerHTML = renderEmpty(
            search ? "No matching people found." : "You haven't added anyone yet."
        );
        return;
    }

    container.innerHTML = people.map(person => {
        const details = [
            person.phone ? `<span>Phone: ${escapeHTML(person.phone)}</span>` : "",
            person.email ? `<span>Email: ${escapeHTML(person.email)}</span>` : "",
            person.contactMethod ? `<span>Contact: ${escapeHTML(person.contactMethod)}</span>` : "",
            person.lastContacted ? `<span>Last contacted: ${formatDate(person.lastContacted)}</span>` : ""
        ].filter(Boolean).join("");

        const metadata = `
            ${categoryBadge(person.relationship)}
            ${person.birthday ? `<span>Birthday: ${formatShortDate(person.birthday)}</span>` : ""}
            ${person.frequency ? `<span>${escapeHTML(person.frequency)} contact</span>` : ""}
        `;

        return `
            <article class="person-card">
                <div class="person-information">
                    <strong>${escapeHTML(person.name)}</strong>

                    <div class="record-meta">
                        ${metadata}
                    </div>

                    ${details ? `
                        <div class="person-contact-details">
                            ${details}
                        </div>
                    ` : ""}

                    ${person.address ? `
                        <p>Location: ${escapeHTML(person.address)}</p>
                    ` : ""}

                    ${person.contactTime ? `
                        <p>Best contact time: ${escapeHTML(person.contactTime)}</p>
                    ` : ""}

                    ${person.reminder && person.reminder !== "None" ? `
                        <p>Contact reminder: ${escapeHTML(person.reminder)}</p>
                    ` : ""}

                    ${person.importantDates ? `
                        <p>Other dates: ${escapeHTML(person.importantDates)}</p>
                    ` : ""}

                    ${person.notes ? `
                        <p class="record-description">${escapeHTML(person.notes)}</p>
                    ` : ""}

                    ${recordActions("people", person.id)}
                </div>
            </article>
        `;
    }).join("");
}

listen("peopleSearch", "input", renderPeople);

listen("personCancel", "click", () => {
    resetRecordForm("people");
});

listen("peopleForm", "submit", event => {
    event.preventDefault();

    const id = getValue("personId") || generateId();

    const person = {
        id,
        name: getValue("personName"),
        relationship: getValue("personRelationship"),
        birthday: getValue("personBirthday"),
        phone: getValue("personPhone"),
        email: getValue("personEmail"),
        contactMethod: getValue("personContactMethod"),
        address: getValue("personAddress"),
        contactTime: getValue("personContactTime"),
        frequency: getValue("personFrequency"),
        lastContacted: getValue("personLastContacted"),
        reminder: getValue("personReminder"),
        reminderTime: getValue("personReminderTime"),
        birthdayReminder: getValue("personBirthdayReminder"),
        importantDates: getValue("personImportantDates"),
        notes: getValue("personNotes")
    };

    if (!person.name) {
        showMessage("Please enter the person's name.", "error");
        return;
    }

    if (saveRecord("people", person)) {
        resetRecordForm("people");
        renderAll();
        showMessage("Person saved successfully.");
    }
});


/* =========================================================
   16. UPCOMING BIRTHDAYS
========================================================= */

function getNextBirthday(birthday) {
    if (!birthday) {
        return null;
    }

    const parts = birthday.split("-").map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
        return null;
    }

    const month = parts[1];
    const day = parts[2];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let nextBirthday = new Date(
        today.getFullYear(),
        month - 1,
        day
    );

    if (nextBirthday < today) {
        nextBirthday = new Date(
            today.getFullYear() + 1,
            month - 1,
            day
        );
    }

    const difference = nextBirthday.getTime() - today.getTime();

    const daysUntil = Math.round(
        difference / (1000 * 60 * 60 * 24)
    );

    return {
        date: nextBirthday,
        days: daysUntil,
        formatted: nextBirthday.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        })
    };
}

function getUpcomingBirthdays(maxDays = 365) {
    return data.people
        .filter(person => person.birthday)
        .map(person => ({
            ...person,
            nextBirthday: getNextBirthday(person.birthday)
        }))
        .filter(person => {
            return person.nextBirthday &&
                person.nextBirthday.days <= maxDays;
        })
        .sort((a, b) => {
            return a.nextBirthday.days - b.nextBirthday.days;
        });
}

function birthdayCountdown(days) {
    if (days === 0) {
        return "Today!";
    }

    if (days === 1) {
        return "Tomorrow";
    }

    return `In ${days} days`;
}

function renderBirthdays() {
    const dashboardContainer = $("upcomingBirthdays");
    const peopleContainer = $("peopleBirthdays");

    const birthdays = getUpcomingBirthdays(365);

    if (!birthdays.length) {
        if (dashboardContainer) {
            dashboardContainer.innerHTML = renderEmpty(
                "Add someone's birthday to see it here."
            );
        }

        if (peopleContainer) {
            peopleContainer.innerHTML = renderEmpty(
                "Your saved birthdays will appear here."
            );
        }

        return;
    }

    const dashboardBirthdays = birthdays.slice(0, 4);

    if (dashboardContainer) {
        dashboardContainer.innerHTML = dashboardBirthdays.map(person => `
            <div class="birthday-item">
                <div class="birthday-information">
                    <strong>${escapeHTML(person.name)}</strong>
                    <p>
                        ${escapeHTML(person.relationship || "Contact")}
                        · ${birthdayCountdown(person.nextBirthday.days)}
                    </p>
                </div>

                <span class="birthday-date">
                    ${person.nextBirthday.formatted}
                </span>
            </div>
        `).join("");
    }

    if (peopleContainer) {
        peopleContainer.innerHTML = birthdays.map(person => `
            <div class="birthday-item">
                <div class="birthday-information">
                    <strong>${escapeHTML(person.name)}</strong>
                    <p>
                        ${escapeHTML(person.relationship || "Contact")}
                        · ${birthdayCountdown(person.nextBirthday.days)}
                    </p>
                </div>

                <span class="birthday-date">
                    ${person.nextBirthday.formatted}
                </span>
            </div>
        `).join("");
    }
}


/* =========================================================
   17. PARTNER MESSAGES
========================================================= */

function renderPartnerMessages() {
    const container = $("partnerMessageList");

    if (!container) {
        return;
    }

    const search = getValue("partnerMessageSearch").toLowerCase();

    const messages = [...data.partnerMessages]
        .filter(message => {
            const text = [
                message.title,
                message.content,
                message.type,
                message.tone
            ].join(" ").toLowerCase();

            return text.includes(search);
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (!messages.length) {
        container.innerHTML = renderEmpty(
            search ? "No matching messages found." : "Your saved messages will appear here."
        );
        return;
    }

    container.innerHTML = messages.map(message => `
        <article class="message-card">
            <div class="record-meta">
                ${categoryBadge(message.type)}
                ${categoryBadge(message.tone)}
                <span>${formatDate(message.createdAt.slice(0, 10))}</span>
            </div>

            <h4>${escapeHTML(message.title)}</h4>

            <div class="message-card-content">${escapeHTML(message.content)}</div>

            ${recordActions("partnerMessages", message.id, {
                copy: true
            })}
        </article>
    `).join("");
}

listen("partnerMessageSearch", "input", renderPartnerMessages);

listen("partnerMessageCancel", "click", () => {
    resetRecordForm("partnerMessages");
});

listen("partnerMessageForm", "submit", event => {
    event.preventDefault();

    const id = getValue("partnerMessageId") || generateId();

    const existing = findRecord("partnerMessages", id);

    const message = {
        id,
        type: getValue("partnerMessageType"),
        tone: getValue("partnerMessageTone"),
        title: getValue("partnerMessageTitle"),
        content: getValue("partnerMessageContent"),
        createdAt: existing?.createdAt || new Date().toISOString()
    };

    if (!message.title || !message.content) {
        showMessage("Please enter a title and message.", "error");
        return;
    }

    if (saveRecord("partnerMessages", message)) {
        resetRecordForm("partnerMessages");
        renderAll();
        showMessage("Your message has been saved.");
    }
});

async function copyPartnerMessage(id) {
    const message = findRecord("partnerMessages", id);

    if (!message) {
        return;
    }

    const text = `${message.title}\n\n${message.content}`;

    try {
        if (!navigator.clipboard?.writeText) {
            throw new Error("Clipboard access is unavailable.");
        }

        await navigator.clipboard.writeText(text);

        showMessage("Message copied to clipboard.");

    } catch (error) {
        window.prompt("Copy your message using Ctrl+C:", text);
    }
}


/* =========================================================
   18. PERSONAL JOURNAL
========================================================= */

function renderJournal() {
    const container = $("journalList");

    if (!container) {
        return;
    }

    const entries = [...data.journal].sort((a, b) => {
        return String(b.date).localeCompare(String(a.date));
    });

    if (!entries.length) {
        container.innerHTML = renderEmpty(
            "Your journal entries will appear here."
        );
        return;
    }

    container.innerHTML = entries.map(entry => `
        <article class="journal-entry">

            <div class="record-meta">
                <span>${formatDate(entry.date)}</span>
                ${categoryBadge(entry.mood)}
            </div>

            <h4>${escapeHTML(entry.title)}</h4>

            <div class="journal-entry-content">
                ${escapeHTML(entry.content)}
            </div>

            ${recordActions("journal", entry.id)}
        </article>
    `).join("");
}

listen("journalCancel", "click", () => {
    resetRecordForm("journal");
});

listen("journalForm", "submit", event => {
    event.preventDefault();

    const id = getValue("journalId") || generateId();

    const entry = {
        id,
        title: getValue("journalTitle"),
        date: getValue("journalDate"),
        mood: getValue("journalMood"),
        content: getValue("journalContent")
    };

    if (!entry.title || !entry.content || !entry.date) {
        showMessage("Please complete your journal entry.", "error");
        return;
    }

    if (saveRecord("journal", entry)) {
        resetRecordForm("journal");
        renderAll();
        showMessage("Journal entry saved.");
    }
});


/* =========================================================
   19. GOALS AND PROGRESS
========================================================= */

function renderGoals() {
    const container = $("goalList");

    if (!container) {
        return;
    }

    if (!data.goals.length) {
        container.innerHTML = renderEmpty(
            "Your goals will appear here."
        );
        return;
    }

    container.innerHTML = data.goals.map(goal => {
        const progress = Math.min(
            100,
            Math.max(0, Number(goal.progress) || 0)
        );

        const metadata = `
            ${categoryBadge(goal.category)}
            ${goal.deadline ? `<span>Target: ${formatDate(goal.deadline)}</span>` : ""}
            ${statusBadge(goal.status)}
        `;

        return `
            <article class="record-item">

                <div class="record-main">
                    <div class="record-content">
                        <h4>${escapeHTML(goal.title)}</h4>

                        ${goal.notes ? `
                            <p class="record-description">
                                ${escapeHTML(goal.notes)}
                            </p>
                        ` : ""}

                        <div class="record-meta">
                            ${metadata}
                        </div>

                        <div class="progress-container">
                            <div class="progress-bar"
                                style="width: ${progress}%"></div>
                        </div>

                        <div class="progress-information">
                            <span>Progress</span>
                            <strong>${progress}%</strong>
                        </div>
                    </div>
                </div>

                ${recordActions("goals", goal.id)}

            </article>
        `;
    }).join("");
}

listen("goalCancel", "click", () => {
    resetRecordForm("goals");
});

listen("goalForm", "submit", event => {
    event.preventDefault();

    const id = getValue("goalId") || generateId();

    const progress = Math.min(
        100,
        Math.max(0, Number(getValue("goalProgress")) || 0)
    );

    const goal = {
        id,
        title: getValue("goalTitle"),
        category: getValue("goalCategory"),
        deadline: getValue("goalDeadline"),
        progress,
        status: getValue("goalStatus"),
        notes: getValue("goalNotes")
    };

    if (!goal.title) {
        showMessage("Please enter a goal title.", "error");
        return;
    }

    if (goal.progress === 100) {
        goal.status = "Completed";
    }

    if (saveRecord("goals", goal)) {
        resetRecordForm("goals");
        renderAll();
        showMessage("Goal saved successfully.");
    }
});


/* =========================================================
   20. EDIT RECORDS
========================================================= */

function editRecord(type, id) {
    const record = findRecord(type, id);

    if (!record) {
        showMessage("The selected record could not be found.", "error");
        return;
    }

    const fields = {
        activities: [
            ["title", "activityTitle"],
            ["date", "activityDate"],
            ["time", "activityTime"],
            ["category", "activityCategory"],
            ["priority", "activityPriority"],
            ["notes", "activityNotes"]
        ],

        timetable: [
            ["day", "timetableDay"],
            ["subject", "timetableSubject"],
            ["start", "timetableStart"],
            ["end", "timetableEnd"],
            ["location", "timetableLocation"]
        ],

        courses: [
            ["name", "courseName"],
            ["code", "courseCode"],
            ["credits", "courseCredits"],
            ["status", "courseStatus"]
        ],

        assignments: [
            ["title", "assignmentTitle"],
            ["course", "assignmentCourse"],
            ["date", "assignmentDate"],
            ["status", "assignmentStatus"],
            ["priority", "assignmentPriority"],
            ["notes", "assignmentNotes"]
        ],

        spiritual: [
            ["type", "spiritualType"],
            ["date", "spiritualDate"],
            ["title", "spiritualTitle"],
            ["content", "spiritualContent"]
        ],

        people: [
            ["name", "personName"],
            ["relationship", "personRelationship"],
            ["birthday", "personBirthday"],
            ["phone", "personPhone"],
            ["email", "personEmail"],
            ["contactMethod", "personContactMethod"],
            ["address", "personAddress"],
            ["contactTime", "personContactTime"],
            ["frequency", "personFrequency"],
            ["lastContacted", "personLastContacted"],
            ["reminder", "personReminder"],
            ["reminderTime", "personReminderTime"],
            ["birthdayReminder", "personBirthdayReminder"],
            ["importantDates", "personImportantDates"],
            ["notes", "personNotes"]
        ],

        partnerMessages: [
            ["type", "partnerMessageType"],
            ["tone", "partnerMessageTone"],
            ["title", "partnerMessageTitle"],
            ["content", "partnerMessageContent"]
        ],

        journal: [
            ["title", "journalTitle"],
            ["date", "journalDate"],
            ["mood", "journalMood"],
            ["content", "journalContent"]
        ],

        goals: [
            ["title", "goalTitle"],
            ["category", "goalCategory"],
            ["deadline", "goalDeadline"],
            ["progress", "goalProgress"],
            ["status", "goalStatus"],
            ["notes", "goalNotes"]
        ]
    };

    if (!fields[type]) {
        return;
    }

    showPage(
        type === "activities" ? "planner" :
        type === "courses" || type === "assignments" ? "school" :
        type === "timetable" ? "timetable" :
        type === "spiritual" ? "spiritual" :
        type === "people" ? "people" :
        type === "partnerMessages" ? "partner" :
        type === "journal" ? "journal" : "goals"
    );

    populateForm(type, record, fields[type]);
}


/* =========================================================
   21. DELETE RECORDS
========================================================= */

const COLLECTION_NAMES = {
    activities: "activity",
    timetable: "timetable entry",
    courses: "course",
    assignments: "assignment",
    spiritual: "spiritual record",
    people: "person",
    partnerMessages: "message",
    journal: "journal entry",
    goals: "goal"
};

function deleteRecord(type, id) {
    if (!Array.isArray(data[type])) {
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to delete this ${COLLECTION_NAMES[type] || "record"}?`
    );

    if (!confirmed) {
        return;
    }

    data[type] = data[type].filter(item => item.id !== id);

    saveData();
    renderAll();

    showMessage("Record deleted successfully.");
}


/* =========================================================
   22. COMPLETE ACTIVITIES AND ASSIGNMENTS
========================================================= */

function toggleRecord(type, id) {
    const record = findRecord(type, id);

    if (!record) {
        return;
    }

    if (type === "activities") {
        record.completed = !record.completed;

    } else if (type === "assignments") {
        record.status = record.status === "Completed"
            ? "Not Started"
            : "Completed";

    } else {
        return;
    }

    saveData();
    renderAll();

    showMessage(
        record.completed || record.status === "Completed"
            ? "Marked as completed."
            : "Record reopened."
    );
}


/* =========================================================
   23. RECORD BUTTON EVENT HANDLING
========================================================= */

document.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");

    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const type = button.dataset.type;
    const id = button.dataset.id;

    if (!type || !id) {
        return;
    }

    if (action === "edit") {
        editRecord(type, id);

    } else if (action === "delete") {
        deleteRecord(type, id);

    } else if (action === "toggle") {
        toggleRecord(type, id);

    } else if (action === "copy" && type === "partnerMessages") {
        copyPartnerMessage(id);
    }
});


/* =========================================================
   24. DASHBOARD
========================================================= */

function renderDashboard() {
    const today = todayString();

    const todayActivities = data.activities
        .filter(activity => activity.date === today)
        .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));

    const completedActivities = todayActivities.filter(
        activity => activity.completed
    );

    const openAssignments = data.assignments.filter(
        assignment => assignment.status !== "Completed"
    );

    const activeGoals = data.goals.filter(
        goal => goal.status !== "Completed"
    );

    setText("todayActivityCount", todayActivities.length);
    setText("completedTaskCount", completedActivities.length);
    setText("assignmentCount", openAssignments.length);
    setText("goalCount", activeGoals.length);

    const activityContainer = $("todayActivities");

    if (activityContainer) {
        if (!todayActivities.length) {
            activityContainer.innerHTML = renderEmpty(
                "You don't have any activities scheduled for today."
            );

        } else {
            activityContainer.innerHTML = todayActivities.map(activity => {
                const time = activity.time
                    ? formatTime(activity.time)
                    : "No time set";

                return `
                    <div class="record-item">
                        <div class="record-main">
                            <div class="record-content">
                                <h4>${escapeHTML(activity.title)}</h4>
                                <div class="record-meta">
                                    <span>${time}</span>
                                    ${statusBadge(
                                        activity.completed ? "Completed" : "In Progress"
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join("");
        }
    }

    renderDashboardReminders();
}

function renderDashboardReminders() {
    const container = $("todayReminders");

    if (!container) {
        return;
    }

    const today = todayString();

    const upcomingActivities = data.activities.filter(activity => {
        return !activity.completed &&
            activity.date >= today &&
            activity.date <= addDays(today, 7);
    });

    const upcomingAssignments = data.assignments.filter(assignment => {
        return assignment.status !== "Completed" &&
            assignment.date >= today &&
            assignment.date <= addDays(today, 7);
    });

    const reminders = [
        ...upcomingActivities.map(item => ({
            title: item.title,
            date: item.date,
            detail: "Activity"
        })),

        ...upcomingAssignments.map(item => ({
            title: item.title,
            date: item.date,
            detail: "Assignment"
        }))
    ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

    if (!reminders.length) {
        container.innerHTML = renderEmpty(
            "You have no upcoming reminders."
        );
        return;
    }

    container.innerHTML = reminders.map(reminder => `
        <div class="record-item">
            <div class="record-main">
                <div class="record-content">
                    <h4>${escapeHTML(reminder.title)}</h4>
                    <div class="record-meta">
                        <span>${escapeHTML(reminder.detail)}</span>
                        <span>${formatDate(reminder.date)}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join("");
}

function addDays(dateString, numberOfDays) {
    const parts = dateString.split("-").map(Number);

    const date = new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );

    date.setDate(date.getDate() + numberOfDays);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* =========================================================
   25. DATE AND FOOTER DISPLAY
========================================================= */

function updateDateDisplay() {
    const now = new Date();

    setText(
        "currentDate",
        now.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        })
    );

    setText("footerYear", `© ${now.getFullYear()}`);
}


/* =========================================================
   26. PERSONAL SETTINGS
========================================================= */

function updatePersonalDisplay() {
    const name = data.settings.displayName.trim();

    setText("sidebarDisplayName", name || "My Space");

    setText(
        "welcomeHeading",
        name ? `Welcome back, ${name} ✨` : "Welcome to My Everyday ✨"
    );
}

function renderSettings() {
    setValue("displayName", data.settings.displayName);
    setValue("weekStart", data.settings.weekStart);

    updatePersonalDisplay();
}

listen("settingsForm", "submit", event => {
    event.preventDefault();

    data.settings.displayName = getValue("displayName");
    data.settings.weekStart = getValue("weekStart") || "Monday";

    if (saveData()) {
        renderSettings();
        renderTimetable();
        showMessage("Your preferences have been saved.");
    }
});


/* =========================================================
   27. PWA INSTALLATION AND SERVICE WORKER
========================================================= */

let serviceWorkerRegistration = null;
let deferredInstallPrompt = null;

async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        console.warn("Service workers are not supported.");
        return null;
    }

    try {
        await navigator.serviceWorker.register("./service-worker.js", {
            scope: "./"
        });

        serviceWorkerRegistration = await navigator.serviceWorker.ready;

        console.log("My Everyday service worker is ready.");

        return serviceWorkerRegistration;

    } catch (error) {
        console.error("Service worker registration failed:", error);
        return null;
    }
}

window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();

    deferredInstallPrompt = event;

    const installButton = $("installAppButton");

    if (installButton) {
        installButton.hidden = false;
        installButton.textContent = "Install App";
    }
});

async function installMyEveryday() {
    const isInstalled =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

    if (isInstalled) {
        showMessage("My Everyday is already installed.");
        return;
    }

    if (deferredInstallPrompt) {
        try {
            deferredInstallPrompt.prompt();

            const result = await deferredInstallPrompt.userChoice;

            if (result.outcome === "accepted") {
                showMessage("My Everyday installation accepted.");
            }

            deferredInstallPrompt = null;

        } catch (error) {
            console.error("App installation failed:", error);
            showMessage("App installation could not be started.", "error");
        }

        return;
    }

    const isAppleMobile =
        /iPhone|iPad|iPod/.test(navigator.userAgent);

    if (isAppleMobile) {
        window.alert(
            "To install My Everyday:\n\n" +
            "1. Open this website in Safari.\n" +
            "2. Tap the Share button.\n" +
            "3. Select Add to Home Screen.\n" +
            "4. Tap Add."
        );

        return;
    }

    window.alert(
        "To install My Everyday, open your browser menu and look for " +
        "'Install My Everyday', 'Install app', or 'Add to Home Screen'."
    );
}

listen("installAppButton", "click", installMyEveryday);

window.addEventListener("appinstalled", () => {
    const installButton = $("installAppButton");

    if (installButton) {
        installButton.hidden = true;
    }

    deferredInstallPrompt = null;

    showMessage("My Everyday has been installed successfully.");
});


/* =========================================================
   28. BROWSER NOTIFICATIONS
========================================================= */

let notificationCheckRunning = false;

function notificationSupported() {
    return "Notification" in window;
}

async function enableNotifications() {
    if (!notificationSupported()) {
        showMessage(
            "Your browser does not support notifications.",
            "error"
        );
        return;
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            setText(
                "notificationStatus",
                "Notifications are enabled in this browser."
            );

            showMessage("Notifications enabled.");

            if (!serviceWorkerRegistration) {
                await registerServiceWorker();
            }

            await sendDueNotifications();

        } else if (permission === "denied") {
            setText(
                "notificationStatus",
                "Notifications are blocked. Change this in your browser settings."
            );

            showMessage(
                "Please allow notifications in your browser settings.",
                "error"
            );

        } else {
            setText(
                "notificationStatus",
                "Notification permission has not been granted."
            );
        }

    } catch (error) {
        console.error("Notification permission error:", error);

        showMessage(
            "Notifications could not be enabled.",
            "error"
        );
    }
}

listen("enableNotifications", "click", enableNotifications);
listen("notificationButton", "click", enableNotifications);

async function sendBrowserNotification(title, body, key) {
    if (
        !notificationSupported() ||
        Notification.permission !== "granted"
    ) {
        return;
    }

    if (data.notified.includes(key)) {
        return;
    }

    try {
        if (serviceWorkerRegistration) {
            await serviceWorkerRegistration.showNotification(title, {
                body,
                icon: "./icons/icon-192.png",
                badge: "./icons/icon-192.png",
                data: {
                    url: "./"
                }
            });

        } else {
            new Notification(title, { body });
        }

        data.notified.push(key);
        saveData();

    } catch (error) {
        console.error("Could not send notification:", error);
    }
}

async function sendDueNotifications() {
    if (
        !notificationSupported() ||
        Notification.permission !== "granted" ||
        notificationCheckRunning
    ) {
        return;
    }

    notificationCheckRunning = true;

    try {
        const today = todayString();
        const now = new Date();

        const currentTime =
            `${String(now.getHours()).padStart(2, "0")}:` +
            `${String(now.getMinutes()).padStart(2, "0")}`;

        // Activity reminders
        for (const activity of data.activities) {
            if (
                !activity.completed &&
                activity.date === today &&
                (!activity.time || activity.time <= currentTime)
            ) {
                await sendBrowserNotification(
                    "My Everyday Reminder",
                    `Activity: ${activity.title}`,
                    `activity-${activity.id}-${today}`
                );
            }
        }

        // Assignment reminders
        for (const assignment of data.assignments) {
            if (
                assignment.status !== "Completed" &&
                assignment.date === today
            ) {
                await sendBrowserNotification(
                    "Assignment Due Today",
                    assignment.title,
                    `assignment-${assignment.id}-${today}`
                );
            }
        }

        // Birthday reminders
        for (const person of data.people) {
            if (
                person.birthday &&
                person.birthdayReminder !== "No"
            ) {
                const nextBirthday = getNextBirthday(person.birthday);

                if (nextBirthday && nextBirthday.days === 0) {
                    await sendBrowserNotification(
                        "Birthday Reminder",
                        `Today is ${person.name}'s birthday!`,
                        `birthday-${person.id}-${today}`
                    );
                }
            }
        }

    } finally {
        notificationCheckRunning = false;
    }
}

function updateNotificationStatus() {
    if (!notificationSupported()) {
        setText(
            "notificationStatus",
            "Your browser does not support notifications."
        );
        return;
    }

    if (Notification.permission === "granted") {
        setText(
            "notificationStatus",
            "Notifications are enabled in this browser."
        );

    } else if (Notification.permission === "denied") {
        setText(
            "notificationStatus",
            "Notifications are blocked. Change this in your browser settings."
        );

    } else {
        setText(
            "notificationStatus",
            "Notifications have not been enabled."
        );
    }
}


/* =========================================================
   29. BACKUP AND RESTORE
========================================================= */

listen("exportData", "click", () => {
    const backup = {
        application: "My Everyday",
        version: 1,
        exportedAt: new Date().toISOString(),
        data
    };

    const file = new Blob(
        [JSON.stringify(backup, null, 4)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = `my-everyday-backup-${todayString()}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    showMessage("Your backup has been downloaded.");
});

listen("importData", "change", event => {
    const file = event.target.files?.[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const imported = JSON.parse(reader.result);

            const restored = imported.data || imported;

            if (
                !restored ||
                typeof restored !== "object" ||
                Array.isArray(restored)
            ) {
                throw new Error("Invalid backup format.");
            }

            const confirmed = window.confirm(
                "Restoring this backup will replace the information currently saved in this browser. Continue?"
            );

            if (!confirmed) {
                event.target.value = "";
                return;
            }

            const allowedCollections = [
                "activities",
                "timetable",
                "courses",
                "assignments",
                "spiritual",
                "people",
                "partnerMessages",
                "journal",
                "goals",
                "notified"
            ];

            allowedCollections.forEach(property => {
                data[property] = Array.isArray(restored[property])
                    ? restored[property]
                    : [];
            });

            data.settings = {
                ...DEFAULT_DATA.settings,
                ...(restored.settings || {})
            };

            saveData();
            renderAll();

            showMessage("Your backup has been restored.");

        } catch (error) {
            console.error("Backup restoration failed:", error);

            showMessage(
                "This file could not be restored. Please choose a valid My Everyday backup.",
                "error"
            );

        } finally {
            event.target.value = "";
        }
    };

    reader.onerror = () => {
        showMessage("The selected backup could not be read.", "error");
        event.target.value = "";
    };

    reader.readAsText(file);
});


/* =========================================================
   30. DELETE ALL SAVED DATA
========================================================= */

listen("deleteAllData", "click", () => {
    const confirmed = window.confirm(
        "Are you sure you want to delete ALL My Everyday information saved in this browser? This action cannot be undone. Download a backup first if you need to keep your information."
    );

    if (!confirmed) {
        return;
    }

    const secondConfirmation = window.confirm(
        "This will remove your activities, courses, assignments, contacts, birthdays, messages, journal entries and goals. Do you really want to continue?"
    );

    if (!secondConfirmation) {
        return;
    }

    data = createDefaultData();

    saveData();
    resetAllForms();
    renderAll();

    showMessage("Your My Everyday data has been cleared.");
});

function resetAllForms() {
    Object.keys(FORM_CONFIG).forEach(type => {
        resetRecordForm(type);
    });
}


/* =========================================================
   31. RENDER ALL SECTIONS
========================================================= */

function renderAll() {
    renderDashboard();

    renderActivities();
    renderTimetable();

    renderCourses();
    renderAssignments();

    renderSpiritual();

    renderPeople();
    renderBirthdays();

    renderPartnerMessages();
    renderJournal();

    renderGoals();
    renderSettings();

    updateDateDisplay();
    updateNotificationStatus();
}


/* =========================================================
   32. INITIALISE DEFAULT FORM DATES
========================================================= */

function initialiseFormDates() {
    setValue("activityDate", todayString());
    setValue("assignmentDate", todayString());
    setValue("spiritualDate", todayString());
    setValue("journalDate", todayString());
}


/* =========================================================
   33. START THE APPLICATION
========================================================= */

async function initialiseApp() {
    initialiseFormDates();

    renderAll();

    updatePersonalDisplay();

    // Register the service worker.
    await registerServiceWorker();

    // Hide the install button if the app is already installed.
    const installButton = $("installAppButton");

    const isInstalled =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

    if (installButton && isInstalled) {
        installButton.hidden = true;
    }

    // Check reminders when the application starts.
    sendDueNotifications();

    // Check reminders every minute while the application is open.
    setInterval(() => {
        sendDueNotifications();
    }, 60 * 1000);

    // Check reminders when the user returns to the application.
    window.addEventListener("focus", sendDueNotifications);

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            sendDueNotifications();
        }
    });

    console.log("My Everyday is ready.");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseApp);
} else {
    initialiseApp();
}


/* =========================================================
   END OF MY EVERYDAY JAVASCRIPT
========================================================= */