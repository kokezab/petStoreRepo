@settings
Feature: Settings

  Background:
    Given the pet store app is running with mocked API data

  Scenario: Settings shows "settings" heading
    When I navigate to "/settings"
    Then I should see "settings" heading

  Scenario: Settings shows dark mode toggle and language selection
    When I navigate to "/settings"
    Then I should see "Dark mode" and "Select language" labels

  Scenario: 
    Given I am on the "settings" page
    When I click on dark mode toggle
    Then I should see "light mode" text
