@pet-detail
Feature: Pet detail

  Background:
    Given the pet store app is running with mocked API data

  Scenario: AT-7 Clicking a pet card navigates to its detail page
    Given I am on the "/pets" page
    When I click on a pet card
    Then I should be on that pet's detail page
    And I should see its name, status, category, photo, and tags

  Scenario: AT-8 Direct navigation to a pet detail page (deep link)
    When I navigate directly to "/pets/1"
    Then I should see pet "1"'s detail

  Scenario: AT-9 Navigating to a nonexistent pet id
    When I navigate directly to "/pets/999999"
    Then I should see a "pet not found" message
    And the app should not crash

  Scenario: AT-10 Back to list from the detail page
    Given I am on a pet's detail page
    When I click "back to list"
    Then I should be back on the "/pets" page

  Scenario: AT-11 "Details for pet" label is not shown on the details page
    Given I am on the pet details page for pet "112233"
    Then the label "Details for pet" should not be displayed
