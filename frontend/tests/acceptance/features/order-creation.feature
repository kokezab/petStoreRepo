@order-creation
Feature: Order creation

  Background:
    Given the pet store app is running with mocked API data

  Scenario: AT-21 Create order entry point hidden when the feature flag is disabled
    Given the "order-creation" feature flag is disabled
    When I navigate to "/orders"
    Then I should not see a "Create order" button

  Scenario: AT-22 Create order entry point visible when the feature flag is enabled
    Given the "order-creation" feature flag is enabled
    When I navigate to "/orders"
    Then I should see a "Create order" button

  Scenario: AT-23 Create order button opens the order form
    Given the order-creation common flow
    Then I should see the "Create order" form

  Scenario: AT-24 Submitting a valid form creates the order
    Given the order-creation common flow
    And I fill in the order form with pet id "1", quantity "2", ship date "2026-08-01" and status "placed"
    And I submit the order form
    Then the "Create order" form should close
    And I should see a confirmation for the created order

  Scenario: AT-25 Empty required fields show validation errors
    Given the order-creation common flow
    And I submit the order form without filling it in
    Then I should see a "Pet is required" validation message
    And I should see a "Quantity is required" validation message
    And the "Create order" form should still be open

  Scenario: AT-26 An API failure keeps the form open with an error
    Given the "order-creation" feature flag is enabled
    And the mocked API returns an error for creating an order
    And I am on the "/orders" page
    When I click the "Create order" button
    And I fill in the order form with pet id "1", quantity "2", ship date "2026-08-01" and status "placed"
    And I submit the order form
    Then I should see an error message instead of a blank page
    And the "Create order" form should still be open

  Scenario: AT-27 Cancelling the form closes it without creating an order
    Given the order-creation common flow
    And I fill in the order form with pet id "1", quantity "2", ship date "2026-08-01" and status "placed"
    And I cancel the order form
    Then the "Create order" form should close
    And no new order should have been created
