import { useState } from "react";
import { Button, Select } from "antd";

export function SettingsPage() {
const [darkMode, setDarkMode] = useState(false);
const [selectedLanguage, setSelectedLanguage] = useState('en');

const toggleDarkMode = () => {
    setDarkMode(!darkMode);
};

    return <div>
        <h2>{selectedLanguage === 'en' ? 'Settings' : 'Podešavanja'}</h2>
        <Button onClick={toggleDarkMode}>
            {darkMode ? 'Light mode' : 'Dark mode'}
        </Button>

        <Select
            value={selectedLanguage}
            onChange={(value) => setSelectedLanguage(value)}
            options={[
                { value: 'en', label: 'English' },
                { value: 'sr', label: 'Serbian' },
            ]}
        />
    </div>
}