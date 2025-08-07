
```
project
├─ .bolt
│  ├─ config.json
│  ├─ ignore
│  └─ prompt
├─ .eslintrc.json
├─ app
│  ├─ api
│  │  ├─ auth
│  │  │  ├─ login
│  │  │  │  └─ route.ts
│  │  │  └─ register
│  │  │     └─ route.ts
│  │  ├─ dashboard
│  │  │  ├─ activities
│  │  │  │  └─ route.ts
│  │  │  └─ stats
│  │  │     └─ route.ts
│  │  ├─ leads
│  │  │  ├─ export
│  │  │  │  └─ route.ts
│  │  │  ├─ import
│  │  │  │  └─ route.ts
│  │  │  ├─ route.ts
│  │  │  ├─ send-email
│  │  │  │  └─ route.ts
│  │  │  └─ [id]
│  │  │     └─ route.ts
│  │  ├─ reports
│  │  │  ├─ export
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ targets
│  │  │  ├─ main
│  │  │  │  └─ route.ts
│  │  │  ├─ route.ts
│  │  │  └─ [id]
│  │  │     └─ route.ts
│  │  ├─ teams
│  │  │  ├─ route.ts
│  │  │  ├─ stats
│  │  │  │  └─ route.ts
│  │  │  └─ [id]
│  │  │     └─ route.ts
│  │  └─ users
│  │     ├─ route.ts
│  │     ├─ stats
│  │     │  └─ route.ts
│  │     └─ [id]
│  │        └─ route.ts
│  ├─ dashboard
│  │  └─ page.tsx
│  ├─ globals.css
│  ├─ layout.tsx
│  ├─ leads
│  │  └─ page.tsx
│  ├─ page.tsx
│  ├─ register
│  │  └─ page.tsx
│  ├─ reports
│  │  └─ page.tsx
│  ├─ settings
│  │  └─ page.tsx
│  ├─ targets
│  │  └─ page.tsx
│  ├─ teams
│  │  └─ page.tsx
│  └─ users
│     └─ page.tsx
├─ components
│  ├─ auth
│  │  └─ LoginForm.tsx
│  ├─ dashboard
│  │  ├─ DashboardStats.tsx
│  │  ├─ QuickActions.tsx
│  │  └─ RecentActivities.tsx
│  ├─ layouts
│  │  ├─ DashboardLayout.tsx
│  │  ├─ Header.tsx
│  │  └─ Sidebar.tsx
│  ├─ leads
│  │  ├─ AddLeadModal.tsx
│  │  ├─ EditLeadModal.tsx
│  │  ├─ ImportLeadsModal.tsx
│  │  ├─ LeadsHeader.tsx
│  │  ├─ LeadsTable.tsx
│  │  └─ SendEmailModal.tsx
│  ├─ reports
│  │  ├─ ReportsCharts.tsx
│  │  ├─ ReportsHeader.tsx
│  │  └─ ReportsTable.tsx
│  ├─ settings
│  │  ├─ DatabaseSettings.tsx
│  │  ├─ EmailSettings.tsx
│  │  ├─ GeneralSettings.tsx
│  │  ├─ SecuritySettings.tsx
│  │  ├─ SettingsHeader.tsx
│  │  └─ SettingsTabs.tsx
│  ├─ targets
│  │  ├─ AddTargetModal.tsx
│  │  ├─ EditTargetModal.tsx
│  │  ├─ TargetsHeader.tsx
│  │  └─ TargetsTable.tsx
│  ├─ teams
│  │  ├─ AddTeamModal.tsx
│  │  ├─ EditTeamModal.tsx
│  │  ├─ ManageTeamMembersModal.tsx
│  │  ├─ TeamsHeader.tsx
│  │  └─ TeamsTable.tsx
│  ├─ ui
│  │  ├─ accordion.tsx
│  │  ├─ alert-dialog.tsx
│  │  ├─ alert.tsx
│  │  ├─ aspect-ratio.tsx
│  │  ├─ avatar.tsx
│  │  ├─ badge.tsx
│  │  ├─ breadcrumb.tsx
│  │  ├─ button.tsx
│  │  ├─ calendar.tsx
│  │  ├─ card.tsx
│  │  ├─ carousel.tsx
│  │  ├─ chart.tsx
│  │  ├─ checkbox.tsx
│  │  ├─ collapsible.tsx
│  │  ├─ command.tsx
│  │  ├─ context-menu.tsx
│  │  ├─ dialog.tsx
│  │  ├─ drawer.tsx
│  │  ├─ dropdown-menu.tsx
│  │  ├─ form.tsx
│  │  ├─ hover-card.tsx
│  │  ├─ input-otp.tsx
│  │  ├─ input.tsx
│  │  ├─ label.tsx
│  │  ├─ menubar.tsx
│  │  ├─ navigation-menu.tsx
│  │  ├─ pagination.tsx
│  │  ├─ popover.tsx
│  │  ├─ progress.tsx
│  │  ├─ radio-group.tsx
│  │  ├─ resizable.tsx
│  │  ├─ scroll-area.tsx
│  │  ├─ select.tsx
│  │  ├─ separator.tsx
│  │  ├─ sheet.tsx
│  │  ├─ skeleton.tsx
│  │  ├─ slider.tsx
│  │  ├─ sonner.tsx
│  │  ├─ switch.tsx
│  │  ├─ table.tsx
│  │  ├─ tabs.tsx
│  │  ├─ textarea.tsx
│  │  ├─ toast.tsx
│  │  ├─ toaster.tsx
│  │  ├─ toggle-group.tsx
│  │  ├─ toggle.tsx
│  │  └─ tooltip.tsx
│  └─ users
│     ├─ AddUserModal.tsx
│     ├─ EditUserModal.tsx
│     ├─ UsersHeader.tsx
│     └─ UsersTable.tsx
├─ components.json
├─ hooks
│  └─ use-toast.ts
├─ lib
│  ├─ db
│  │  └─ mongodb.js
│  ├─ email
│  │  └─ emailService.js
│  ├─ utils
│  │  └─ auth.js
│  └─ utils.ts
├─ models
│  ├─ Lead.js
│  ├─ Target.js
│  ├─ Team.js
│  └─ User.js
├─ next.config.js
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ tailwind.config.ts
└─ tsconfig.json

```