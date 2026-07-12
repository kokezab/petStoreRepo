import { useState } from "react";
import { Button } from "antd";

export function SettingsPage() {
const [darkMode, setDarkMode] = useState(false);

const toggleDarkMode = () => {
    setDarkMode(!darkMode);
};

    return <div>
        <h2>Settings</h2>
        <Button onClick={toggleDarkMode}>
            {darkMode ? 'Light mode' : 'Dark mode'}
        </Button>
        <label>Select language</label>
    </div>
}