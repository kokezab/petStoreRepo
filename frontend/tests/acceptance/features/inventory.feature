@inventory
Feature: Store inventory

  Background:
    Given the pet store app is running with mocked API data

  Scenario: AT-11 Inventory shows pet counts grouped by status
    When I navigate to "/inventory"
    Then I should see pet counts grouped by "available", "pending", and "sold"

  Scenario: AT-12 Loading indicator while inventory is loading
    Given the mocked inventory request is delayed
    When I navigate to "/inventory"
    Then I should see a loading indicator before the counts appear

  Scenario: AT-13 Error state when the inventory request fails
    Given the mocked API returns an error for the inventory request
    When I navigate to "/inventory"
    Then I should see an error message instead of a blank page
