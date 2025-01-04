### Front-End System Documentation

This document describes the structure, features, and behavior of the system developed using **React.js** and **React-Bootstrap**. The system includes a login screen, a home page for managing departments and employees, and additional features like creating and editing job positions, performing bulk actions on employees, and displaying detailed employee data.

### Access the Project

You can visit the [Project](https://heroic-alfajores-da3394.netlify.app/). There you can to use functions and to experience for yourself.

---

### 1. Login Screen

**Description**:  
The login screen is the initial page of the system. The user must enter their credentials to access the system.

- **Input Fields**:  
  - **Username**: A text field where the user enters their username.
  - **Password**: A password field for entering the password.
  
- **Actions**:  
  - **Login Button**: Authenticates the user upon clicking.
  
- **Flow**:  
  - After successful login, the user is redirected to the home page, where departments are displayed.

---

### 2. Home Page

**Description**:  
On the home page, existing departments are listed. The user can edit department names and create new departments.

- **Main Elements**:
  - **Departments**: A list of departments, each with an editable name.
  - **Create Department Button**: Allows the user to create a new department.
  - **Department Edit**: Departments can be renamed directly on the page.
  
- **Actions**:
  - **Add Employee Button (Header)**: A button in the header that allows the user to add an employee to the system.
  - **Back to Home Button**: A button in the header that takes the user back to the home page.
  - **Logout Button**: Logs the user out of the system and redirects to the login page.

---

### 3. Department Page

**Description**:  
On the department page, the user can create job positions, edit departments, and add or remove employees from specific positions within departments.

- **Main Elements**:
  - **Department List**: A list of all departments, each with options to edit.
  - **Create Job Position**: When a job position is created, an expandable "collapse" view shows the employees associated with that position.
  - **Edit Department Button**: Allows users to edit the department name.
  - **Create Job Position Button**: Allows the user to add a new job position to the department.
  
- **Actions**:
  - **Add Employee to Position**: After creating a job position, a button allows the user to add employees directly to the position.
  - **Bulk Edit**: Enables bulk editing of multiple employees at once by selecting them.
  - **Bulk Delete**: Allows the user to delete multiple employees at once.

---

### 4. Employee Features

**Description**:  
Each department contains employees, which are displayed in cards. The user can expand a card to see detailed employee information, as well as edit or delete individual employees.

- **Main Elements**:
  - **Employee Card**: Displays employee information, such as name, position, and department.
  - **Expand Button**: Clicking this button reveals additional details about the employee.
  - **Edit Button**: Allows the user to edit the employee's information.
  - **Delete Button**: Deletes the employee from the department or position.
  
- **Actions**:
  - **Delete Employee**: The user can delete an individual employee from a department or position. Deletions can also be done in bulk from the department page.
  - **Edit Employee Information**: The user can edit the employee's details from the employee card or perform bulk edits from the department page.

---

### 5. Navigation Flow

- **Login**:  
  The user logs into the system via the login page. Upon successful login, the user is redirected to the home page, where they can view and manage departments and employees.

- **Navigating to the Department Page**:  
  The user can click on any department in the home page to navigate to the department management page.

- **Actions within the Department Page**:  
  - The user can create job positions, rename departments, and add or remove employees from specific positions.
  - The interface provides buttons for editing, adding, and deleting employees or job positions.

---

### 6. Component Structure

Below is the description of the key components in the application, leveraging **React-Bootstrap** for styling and UI components.

#### **Components**

- **LoginPage**  
  - Responsible for rendering the login form using **React-Bootstrap's Form** components.
  - Handles login submission and redirects after authentication.

- **HomePage**  
  - Displays the list of departments using **React-Bootstrap's Card** and **Button** components.
  - Main component for the home page.

- **SectorList**  
  - A list of departments with options to edit and delete, styled with **React-Bootstrap's ListGroup** or **Card** components.

- **SectorCard**  
  - Displays the department's information in a card format.
  - Contains a button for creating job positions and viewing department details.

- **JobPositionCollapse**  
  - A **Collapse** component from React-Bootstrap that shows job positions within a department.
  - Allows expanding to view employees linked to that position and provides options to add employees.

- **EmployeeCard**  
  - Displays detailed employee information in a **Card** component from React-Bootstrap.
  - Contains **Button** components for expanding, editing, and deleting the employee.

- **EmployeeForm**  
  - A form for creating or editing employee details, utilizing **Form** components from React-Bootstrap.

- **MassActions**  
  - A component responsible for handling bulk editing and deleting of employees, using **Form** and **Button** components for interaction.

---

### 7. Technologies Used

- **React.js**:  
  JavaScript library for building user interfaces, providing a component-based architecture.

- **React-Bootstrap**:  
  A library of Bootstrap components built for React, used for creating responsive and accessible user interfaces (e.g., buttons, cards, forms, modals, collapses).

- **React Router**:  
  A library for navigating between pages in a React application (e.g., login, home, department pages).

- **Axios**:  
  Used for making HTTP requests to the backend for fetching or manipulating data related to departments, positions, and employees.

---

### 8. Final Considerations

This system offers an intuitive user interface for managing departments, positions, and employees. The system supports creating, editing, and deleting departments, positions, and employees, both individually and in bulk. The use of **React-Bootstrap** ensures a responsive design, improving the user experience across various devices.

---

**Note**: This document outlines the core features and structure of the system. Any new features or changes to the current flow should be reflected in future updates of this documentation.
