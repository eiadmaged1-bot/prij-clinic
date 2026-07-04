# Service Price Catalog

The service catalog stores clinic billing settings for services provided by the clinic.

Fields:
- `code`
- `name`
- `category`
- `price`
- `currency`
- `active`
- optional cost placeholder
- optional doctor share placeholder
- `createdAt`
- `updatedAt`

Owner/Admin users can create services, edit service settings, change prices, and deactivate/reactivate services. Price and status changes require a reason and are audited.

The service catalog is not:
- a medication reference catalog
- an investigation reference price list
- an insurance or TPA schedule
- a real payment gateway
- a full accounting ledger

Medication reference pricing and official medication metadata remain separate from clinic service billing settings.
