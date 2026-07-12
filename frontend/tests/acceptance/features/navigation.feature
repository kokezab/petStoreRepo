@navigation
Feature: Top navigation

  Background:
    Given the pet store app is running with mocked API data

  Scenario: AT-14 Nav links route to the corresponding page
    Given I am on the "/pets" page
    When I click the "Inventory" nav link
    Then I should be on the "/inventory" page
    When I click the "Pets" nav link
    Then I should be on the "/pets" page
