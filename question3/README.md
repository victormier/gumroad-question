# Question 3: A data modeling question

The proposed solution uses three models: `Purchase`, `Refund` and `Payout` that represent an operation on the balance:

- Balance is stored as a decimal on the seller
- Balance is computed whenever a new operation is created and stored on the seller for performance (# of operations can be very high, so calculating it from operations, whereas possible, is not efficient). This balance update will require a row-level lock on the seller for data consistency, which could become a potential bottleneck, especially if the frequency of operations is very high.
- There's 3 types of operations: `Purchase`, `Refund` and `Payout`. A `Purchase` adds value (money) to your balance, a `Refund` or a `Payout` subtracts money from your balance. Whenever one of these entities is created, the balance on the seller is updated accordingly.
- A `Purchase` can be refunded. A refund generates a new instance of `Refund` associated with the purchase with the negative value of that purchase.
- A `Purchase` can or cannot be "paid out". A purchase is "paid out" if it has an associated payout.
- A `Payout` is an operation that subtracts money from a sellers' balance and sends it to his/her bank account/Paypal. Every second Friday a task generates a new `Payout`. All "non-paid out" purchases up to a week before are taken into account. The value of the payout is calculated as the sum of all the selected purchases that haven't been refunded. All those purchases (refunded or not) are then assigned to that payout, marking them as "paid out". The payout-generating task frequency and purchase period can be easily modified and stored as configuration in code or database. The task would go like this:
  - Find all users that have a positive balance.
  - For each seller, find all purchases:
    - for that seller ("seller_id = ...")
    - that haven't been paid: ("paid_out IS NULL")
    - bought on a specific period ("purchased_at < ...")
  - Create the corresponding payout.
- In a real-world design a payout would probably have intermediate states (sent to Paypal, confirmed, rejected...) which would have implications on the creation of the corresponding operation.

Remaining questions/edge cases:

- How do we charge the seller when there's not enough balance to satisfy a refund?

## Diagram (simplified)

![Data model schema](https://raw.githubusercontent.com/victormier/gumroad-question/main/question3/diagram.png)

## Database tables and models.

This assumes ActiveRecord and PostgreSQL are being used. This is an incomplete schema and untested code that includes the minimum information to convey the design idea.

```
sellers
________
id
balance

class Seller < ApplicationRecord
  has_many :products
end

# note: I left out the possible relationships for listing operations (purchases, payouts, refunds) as the use case wasn't specified in the exercise. I considered using an intermediate "balance_operations" table (which would be useful for this) but discarded it as unnecessary.

products
________
id
seller_id

class Product < ApplicationRecord
  has_many :purchases
  belongs_to :seller
end

add_index :products, :seller_id # Use case: retrieving products for a seller

purchases
________
id
product_id
payout_id
refund_id
seller_id # we have to denormalize seller_id for querying purchases for a seller
purchased_at: date
value

class Purchase < ApplicationRecord
  belongs_to :product
  belongs_to :payout
  belongs_to :refund
  belongs_to :seller
end

add_index :purchases, [:purchased_at, :seller_id], where: "payout_id is null" # Use case: retrieving non paid out purchases for a date range (we use a partial index to minimize size and improve performance). MySQL, unlike PostgreSQL, doesn't support partial indexes.
add_index :purchases, :product_id # Use case: retrieving purchases for a product (not specified in exercise, but likely useful)
add_index :purchases, :payout_id # Use case: listing purchases for a payout.

# refund_id is stored in purchases instead of refunds to improve the speed of calculation of a payout amount: all purchases where payout_id is null and refund_id is null up to a date. We would still mark all purchases before a date (refunded or not) as paid on a payout.

payouts
________
id
seller_id
value

class Payout < ApplicationRecord
  belongs_to :seller
  has_many :purchases
end

add_index :payouts, :seller_id # Use case: listing payouts for a seller.

refunds
________
id

class Refund < ApplicationRecord
  has_one :purchase
end

# note: we could also denormalize seller_id and add it to refunds with an index on seller_id for a more performant listing of refunds (if the case was needed).

```

## Alternative solution

An alternative data model design I considered was using an Event Sourcing pattern. On such a design, we store all events that affect the system on secondary tables instead of the current state. These events would be any operation that affects the balance (purchases, payouts, refunds). This way the state (balance) is derived from the events, having a perfect audit trail of what has happened in the system at any point (state could also be stored for performance and the event stream used as needed). I didn't feel comfortable enough proposing a solution using EventSourcing because of its complexities and my little experience with it but found it worth mentioning.
