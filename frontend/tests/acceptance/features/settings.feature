@settings
Feature: Settings

  Background:
    Given the pet store app is running with mocked API data

  Scenario: Settings shows "settings" heading
    When I navigate to "/settings"
    Then I should see "settings" heading

  Scenario: Settings shows dark mode toggle
    When I navigate to "/settings"
    Then I should see "Dark mode" text

  Scenario: Clicking dark mode toggle should update text to Light mode
    Given I am on the "settings" page
    When I click on dark mode toggle
    Then I should see "light mode" text

  Scenario: Clicking dark mode toggle should visually apply dark theme
    Given I am on the "settings" page
    When I click on dark mode toggle
    Then the page should visually match the "dark" theme

  Scenario: Clicking dark mode toggle when dark mode is on should visually apply dark theme
    Given I am on the "settings" page
    And I click on dark mode toggle
    When I click on dark mode toggle
    Then the page should visually match the "light" theme

  Scenario: Settings shows language selector
    When I navigate to "/settings"
    Then I should see "Language" text

  Scenario: Selecting Serbian language translates visible text
    Given I am on the "settings" page
    When I chose "Serbian" option for dropdown with current value "English"
    Then I should see "Podešavanja" heading
    Then I should see "Jezik" text