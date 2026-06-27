export const menuItems = [
  {
    isHeadr: true,
    title: "Menu",
    roles: ["admin", "hr", "interviewer"],
  },

  // ===== ADMIN =====
  {
    title: "Dashboard",
    icon: "heroicons-outline:home",
    link: "admin/dashboard",
    roles: ["admin"],
  },
  {
    title: "Candidates",
    icon: "heroicons:user-group",
    link: "admin/candidate",
    roles: ["admin"],
  },
  {
    title: "Interviews",
    icon: "heroicons:sparkles",
    link: "admin/interviews",
    roles: ["admin"],
  },
  {
    title: "Status",
    icon: "heroicons:flag",
    link: "admin/status",
    roles: ["admin"],
  },

  // ===== HR =====
  {
    title: "HR Dashboard",
    icon: "heroicons-outline:home",
    link: "hr/dashboard",
    roles: ["hr"],
  },
  {
    title: "Interviews",
    icon: "heroicons:sparkles",
    link: "hr/interviews",
    roles: ["hr"],
  },

  // ===== INTERVIEWER =====
  {
    title: "Dashboard",
    icon: "heroicons-outline:home",
    link: "interviewer/dashboard",
    roles: ["interviewer"],
  },
  {
    title: "Interviews",
    icon: "heroicons:sparkles",
    link: "interviewer/interviews",
    roles: ["interviewer"],
  },

  // ===== CANDIDATES (divider) =====
  {
    isHeadr: true,
    title: "NEW FLOW (RESUME-FIRST)",
    roles: ["admin", "hr"],
  },

  // ===== SHARED (all roles) =====
  {
    title: "Interview List",
    icon: "heroicons:calendar-days",
    link: "interview-list",
    roles: ["admin", "hr", "interviewer"],
  },
  {
    title: "Bulk Resume Upload",
    icon: "heroicons:document-duplicate",
    link: "bulk-resume-upload",
    roles: ["admin", "hr"],
  },

  {
    title: "Manage Candidates",
    icon: "heroicons:user-group",
    link: "candidates",
    roles: ["admin", "hr"],
  },
  {
    title: "Manage Interviewers",
    icon: "heroicons:user-circle",
    link: "interviewers",
    roles: ["admin", "hr"],
  },
  {
    title: "Interview Requests",
    icon: "heroicons:bell-alert",
    link: "interview-requests",
    // Interviewers can view (read-only); admin/hr can act on them.
    roles: ["admin", "hr", "interviewer"],
    // Live pending-count badge; resolved dynamically in Navmenu.
    badgeKey: "interviewRequests",
  },
  {
    title: "Availability",
    icon: "heroicons:clock",
    link: "availability",
    roles: ["admin", "interviewer"],
  },

  // ===== DEVELOPER (divider) =====
  {
    isHeadr: true,
    title: "DEVELOPER",
    roles: ["admin"],
  },
  {
    title: "Manage Developers",
    icon: "heroicons:users",
    link: "admin/developers",
    roles: ["admin"],
  },
];

export const topMenu = [
  {
    title: "Dashboard",
    icon: "heroicons-outline:home",
    link: "/app/home",
    child: [
      {
        childtitle: "Analytics Dashboard",
        childlink: "dashboard",
        childicon: "heroicons:presentation-chart-line",
      },
      {
        childtitle: "Ecommerce Dashboard",
        childlink: "ecommerce",
        childicon: "heroicons:shopping-cart",
      },
      {
        childtitle: "Project  Dashboard",
        childlink: "project",
        childicon: "heroicons:briefcase",
      },
      {
        childtitle: "CRM Dashboard",
        childlink: "crm",
        childicon: "ri:customer-service-2-fill",
      },
      {
        childtitle: "Banking Dashboard",
        childlink: "banking",
        childicon: "heroicons:wrench-screwdriver",
      },
    ],
  },
  {
    title: "App",
    icon: "heroicons-outline:chip",
    link: "/app/home",
    child: [
      {
        childtitle: "Calendar",
        childlink: "calender",
        childicon: "heroicons-outline:calendar",
      },
      {
        childtitle: "Kanban",
        childlink: "kanban",
        childicon: "heroicons-outline:view-boards",
      },
      {
        childtitle: "Todo",
        childlink: "todo",
        childicon: "heroicons-outline:clipboard-check",
      },
      {
        childtitle: "Projects",
        childlink: "projects",
        childicon: "heroicons-outline:document",
      },
    ],
  },
  {
    title: "Pages",
    icon: "heroicons-outline:view-boards",
    link: "/app/home",
    megamenu: [
      {
        megamenutitle: "Authentication",
        megamenuicon: "heroicons-outline:user",
        singleMegamenu: [
          {
            m_childtitle: "Signin One",
            m_childlink: "/",
          },
          {
            m_childtitle: "Signin Two",
            m_childlink: "/login2",
          },
          {
            m_childtitle: "Signin Three",
            m_childlink: "/login3",
          },
          {
            m_childtitle: "Signup One",
            m_childlink: "/register",
          },
          {
            m_childtitle: "Signup Two",
            m_childlink: "/register/register2",
          },
          {
            m_childtitle: "Signup Three",
            m_childlink: "/register/register3",
          },
          {
            m_childtitle: "Forget Password One",
            m_childlink: "/forgot-password",
          },
          {
            m_childtitle: "Forget Password Two",
            m_childlink: "/forgot-password2",
          },
          {
            m_childtitle: "Forget Password Three",
            m_childlink: "/forgot-password3",
          },
          {
            m_childtitle: "Lock Screen One",
            m_childlink: "/lock-screen",
          },
          {
            m_childtitle: "Lock Screen Two",
            m_childlink: "/lock-screen2",
          },
          {
            m_childtitle: "Lock Screen Three",
            m_childlink: "/lock-screen3",
          },
        ],
      },

      {
        megamenutitle: "Components",
        megamenuicon: "heroicons-outline:user",
        singleMegamenu: [
          {
            m_childtitle: "typography",
            m_childlink: "typography",
          },
          {
            m_childtitle: "colors",
            m_childlink: "colors",
          },
          {
            m_childtitle: "alert",
            m_childlink: "alert",
          },
          {
            m_childtitle: "button",
            m_childlink: "button",
          },
          {
            m_childtitle: "card",
            m_childlink: "card",
          },
          {
            m_childtitle: "carousel",
            m_childlink: "carousel",
          },
          {
            m_childtitle: "dropdown",
            m_childlink: "dropdown",
          },
          {
            m_childtitle: "image",
            m_childlink: "image",
          },
          {
            m_childtitle: "modal",
            m_childlink: "modal",
          },
          {
            m_childtitle: "Progress bar",
            m_childlink: "progress-bar",
          },
          {
            m_childtitle: "Placeholder",
            m_childlink: "placeholder",
          },

          {
            m_childtitle: "Tab & Accordion",
            m_childlink: "tab-accordion",
          },
        ],
      },
      {
        megamenutitle: "Forms",
        megamenuicon: "heroicons-outline:user",
        singleMegamenu: [
          {
            m_childtitle: "Input",
            m_childlink: "input",
          },
          {
            m_childtitle: "Input group",
            m_childlink: "input-group",
          },
          {
            m_childtitle: "Input layout",
            m_childlink: "input-layout",
          },
          {
            m_childtitle: "Form validation",
            m_childlink: "form-validation",
          },
          {
            m_childtitle: "Wizard",
            m_childlink: "form-wizard",
          },
          {
            m_childtitle: "Input mask",
            m_childlink: "input-mask",
          },
          {
            m_childtitle: "File input",
            m_childlink: "file-input",
          },
          {
            m_childtitle: "Form repeater",
            m_childlink: "form-repeater",
          },
          {
            m_childtitle: "Textarea",
            m_childlink: "textarea",
          },
          {
            m_childtitle: "Checkbox",
            m_childlink: "checkbox",
          },
          {
            m_childtitle: "Radio button",
            m_childlink: "radio-button",
          },
          {
            m_childtitle: "Switch",
            m_childlink: "switch",
          },
        ],
      },
      {
        megamenutitle: "Utility",
        megamenuicon: "heroicons-outline:user",
        singleMegamenu: [
          {
            m_childtitle: "Invoice",
            m_childlink: "invoice",
          },
          {
            m_childtitle: "Pricing",
            m_childlink: "pricing",
          },

          // {
          //   m_childtitle: "Testimonial",
          //   m_childlink: "testimonial",
          // },
          {
            m_childtitle: "FAQ",
            m_childlink: "faq",
          },
          {
            m_childtitle: "Blank page",
            m_childlink: "blank-page",
          },
          {
            m_childtitle: "Blog",
            m_childlink: "blog",
          },
          {
            m_childtitle: "404 page",
            m_childlink: "/404",
          },
          {
            m_childtitle: "Coming Soon",
            m_childlink: "/coming-soon",
          },
          {
            m_childtitle: "Under Maintanance page",
            m_childlink: "/under-construction",
          },
        ],
      },
    ],
  },

  {
    title: "Widgets",
    icon: "heroicons-outline:view-grid-add",
    link: "form-elements",
    child: [
      {
        childtitle: "Basic",
        childlink: "basic",
        childicon: "heroicons-outline:document-text",
      },
      {
        childtitle: "Statistic",
        childlink: "statistic",
        childicon: "heroicons-outline:document-text",
      },
    ],
  },

  {
    title: "Extra",
    icon: "heroicons-outline:template",

    child: [
      {
        childtitle: "Basic Table",
        childlink: "table-basic",
        childicon: "heroicons-outline:table",
      },
      {
        childtitle: "Advanced table",
        childlink: "table-advanced",
        childicon: "heroicons-outline:table",
      },
      {
        childtitle: "Apex chart",
        childlink: "appex-chart",
        childicon: "heroicons-outline:chart-bar",
      },
      {
        childtitle: "Chart js",
        childlink: "chartjs",
        childicon: "heroicons-outline:chart-bar",
      },
      {
        childtitle: "Map",
        childlink: "map",
        childicon: "heroicons-outline:map",
      },
    ],
  },
];

import User from "@/assets/images/users/user.png";
export const notifications = [
  {
    title: "Your order is placed",
    desc: "Amet minim mollit non deser unt ullamco est sit aliqua.",

    image: User,
    link: "#",
  },
  {
    title: "Congratulations Darlene  🎉",
    desc: "Won the monthly best seller badge",
    unread: true,
    image: User,
    link: "#",
  },
  {
    title: "Revised Order 👋",
    desc: "Won the monthly best seller badge",

    image: User,
    link: "#",
  },
  {
    title: "Brooklyn Simmons",
    desc: "Added you to Top Secret Project group...",

    image: User,
    link: "#",
  },
];

export const message = [
  {
    title: "Wade Warren",
    desc: "Hi! How are you doing?.....",
    active: true,
    hasnotifaction: true,
    notification_count: 1,
    image: User,
    link: "#",
  },
  {
    title: "Savannah Nguyen",
    desc: "Hi! How are you doing?.....",
    active: false,
    hasnotifaction: false,
    image: User,
    link: "#",
  },
  {
    title: "Ralph Edwards",
    desc: "Hi! How are you doing?.....",
    active: false,
    hasnotifaction: true,
    notification_count: 8,
    image: User,
    link: "#",
  },
  {
    title: "Cody Fisher",
    desc: "Hi! How are you doing?.....",
    active: true,
    hasnotifaction: false,
    image: User,
    link: "#",
  },
  {
    title: "Savannah Nguyen",
    desc: "Hi! How are you doing?.....",
    active: false,
    hasnotifaction: false,
    image: User,
    link: "#",
  },
  {
    title: "Ralph Edwards",
    desc: "Hi! How are you doing?.....",
    active: false,
    hasnotifaction: true,
    notification_count: 8,
    image: User,
    link: "#",
  },
  {
    title: "Cody Fisher",
    desc: "Hi! How are you doing?.....",
    active: true,
    hasnotifaction: false,
    image: User,
    link: "#",
  },
];

export const colors = {
  primary: "#ffff",
  secondary: "#A0AEC0",
  danger: "#F1595C",
  black: "#111112",
  warning: "#FA916B",
  info: "#0CE7FA",
  light: "#425466",
  success: "#50C793",
  "gray-f7": "#F7F8FC",
  dark: "#1E293B",
  "dark-gray": "#0F172A",
  gray: "#68768A",
  gray2: "#ffff",
  "dark-light": "#CBD5E1",
};

export const hexToRGB = (hex, alpha) => {
  var r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);

  if (alpha) {
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
  } else {
    return "rgb(" + r + ", " + g + ", " + b + ")";
  }
};

export const topFilterLists = [
  {
    name: "Inbox",
    value: "all",
    icon: "uil:image-v",
  },
  {
    name: "Starred",
    value: "fav",
    icon: "heroicons:star",
  },
  {
    name: "Sent",
    value: "sent",
    icon: "heroicons-outline:paper-airplane",
  },

  {
    name: "Drafts",
    value: "drafts",
    icon: "heroicons-outline:pencil-alt",
  },
  {
    name: "Spam",
    value: "spam",
    icon: "heroicons:information-circle",
  },
  {
    name: "Trash",
    value: "trash",
    icon: "heroicons:trash",
  },
];

export const bottomFilterLists = [
  {
    name: "personal",
    value: "personal",
    icon: "heroicons:chevron-double-right",
  },
  {
    name: "Social",
    value: "social",
    icon: "heroicons:chevron-double-right",
  },
  {
    name: "Promotions",
    value: "promotions",
    icon: "heroicons:chevron-double-right",
  },
  {
    name: "Business",
    value: "business",
    icon: "heroicons:chevron-double-right",
  },
];

import meetsImage1 from "@/assets/images/svg/sk.svg";
import meetsImage2 from "@/assets/images/svg/path.svg";
import meetsImage3 from "@/assets/images/svg/dc.svg";
import meetsImage4 from "@/assets/images/svg/sk.svg";

export const meets = [
  {
    img: meetsImage1,
    title: "Meeting with client",
    date: "01 Nov 2021",
    meet: "Zoom meeting",
  },
  {
    img: meetsImage2,
    title: "Design meeting (team)",
    date: "01 Nov 2021",
    meet: "Skyp meeting",
  },
  {
    img: meetsImage3,
    title: "Background research",
    date: "01 Nov 2021",
    meet: "Google meeting",
  },
  {
    img: meetsImage4,
    title: "Meeting with client",
    date: "01 Nov 2021",
    meet: "Zoom meeting",
  },
];
import file1Img from "@/assets/images/icon/file-1.svg";
import file2Img from "@/assets/images/icon/pdf-1.svg";
import file3Img from "@/assets/images/icon/zip-1.svg";
import file4Img from "@/assets/images/icon/pdf-1.svg";
import file5Img from "@/assets/images/icon/scr-1.svg";

export const files = [
  {
    img: file1Img,
    title: "Dashboard.fig",
    date: "06 June 2021 / 155MB",
  },
  {
    img: file2Img,
    title: "Ecommerce.pdf",
    date: "06 June 2021 / 155MB",
  },
  {
    img: file3Img,
    title: "Job portal_app.zip",
    date: "06 June 2021 / 155MB",
  },
  {
    img: file4Img,
    title: "Ecommerce.pdf",
    date: "06 June 2021 / 155MB",
  },
  {
    img: file5Img,
    title: "Screenshot.jpg",
    date: "06 June 2021 / 155MB",
  },
];
