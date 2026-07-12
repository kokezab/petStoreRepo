@planetsoft
Feature: Planet soft Home Page

  Scenario: Check title
    Given I am on Planet soft home page
    When I click link "CONTACT"
    Then I see in title "We are here to help"
