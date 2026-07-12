@pet-list
Feature: Pet list browsing

  Background:
    Given the pet store app is running with mocked API data

  Scenario: AT-1 Default view shows available pets
    When I navigate to "/pets"
    Then the pet list should show only pets with status "available"
    And each pet should be listed by name

  Scenario: AT-2 Filtering by pending status
    Given I am on the "/pets" page
    When I select the "pending" status filter
    Then the pet list should show only pets with status "pending"

  Scenario: AT-3 Filtering by sold status
    Given I am on the "/pets" page
    When I select the "sold" status filter
    Then the pet list should show only pets with status "sold"

  Scenario: AT-4 Loading indicator while pets are loading
    Given the mocked pet list request is delayed
    When I navigate to "/pets"
    Then I should see a loading indicator before the list appears

  Scenario: AT-5 Empty state when a filter has no matches
    Given the mocked API returns no pets for status "sold"
    And I am on the "/pets" page
    When I select the "sold" status filter
    Then I should see an empty-state message

  Scenario: AT-6 Error state when the pet list request fails
    Given the mocked API returns an error for the pet list request
    When I navigate to "/pets"
    Then I should see an error message instead of a blank page
