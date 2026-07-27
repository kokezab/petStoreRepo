@pet-category-filter
Feature: Pet list category filtering

  Category filtering is client-side only (no API support) and gated behind
  the "pet-category-filter" feature flag.

  Background:
    Given the pet store app is running with mocked API data

  Scenario: AT-27 Category filter hidden when the feature flag is disabled
    Given the "pet-category-filter" feature flag is disabled
    When I navigate to "/pets"
    Then I should not see the "Category filter" dropdown

  Scenario: AT-28 Category filter visible when the feature flag is enabled
    Given the "pet-category-filter" feature flag is enabled
    When I navigate to "/pets"
    Then I should see the "Category filter" dropdown

  Scenario: AT-29 Filtering by category
    Given the "pet-category-filter" feature flag is enabled
    And I am on the "/pets" page
    When I chose dropdown "Category filter" value "Dogs"
    Then the pet list should show only pets with status "available" and category "Dogs"

  Scenario: AT-30 Category filter combines with status filter
    Given the "pet-category-filter" feature flag is enabled
    And I am on the "/pets" page
    When I chose dropdown "Status filter" value "pending"
    And I chose dropdown "Category filter" value "Dogs"
    Then the pet list should show only pets with status "pending" and category "Dogs"

  Scenario: AT-31 Category filter persists across status changes
    Given the "pet-category-filter" feature flag is enabled
    And I am on the "/pets" page
    When I chose dropdown "Category filter" value "Dogs"
    And I chose dropdown "Status filter" value "sold"
    Then the pet list should show only pets with status "sold" and category "Dogs"

  Scenario: AT-32 Empty state when no pets match the selected category
    Given the "pet-category-filter" feature flag is enabled
    And I am on the "/pets" page
    When I chose dropdown "Category filter" value "Cats"
    Then I should see an empty-state message

  Scenario: AT-33 Clearing the category filter shows all pets again
    Given the "pet-category-filter" feature flag is enabled
    And I am on the "/pets" page
    When I chose dropdown "Category filter" value "Dogs"
    And I clear the "Category filter" dropdown
    Then the pet list should show only pets with status "available"
