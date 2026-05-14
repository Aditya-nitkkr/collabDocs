import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import CollaborativeEditor from "./Editor.jsx";
import { Signup } from "./pages/Signup.jsx";
import { Login } from "./pages/Login.jsx";
import { EditorDashboard } from "./pages/EditorDashboard.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/editor/home" />
    },
    {
        path: "/signup",
        element: <Signup />,

    },
    {
        path: "/login",
        element: <Login />,

    },
    {
        path: "/editor/home",
        element: <EditorDashboard />
    },
    {
        path: "/editor/:id",
        element: <CollaborativeEditor />
    }

]);

const App = () => {
    return <RouterProvider router={router}></RouterProvider>
}

export default App;

