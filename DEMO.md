# Type-Level Arithmetic Demo

Step-by-step decomposition of how `Sum` works at the type level.

## Demo 1: Simple case (2 + 3 = 5, no carry)

```bash
# Step 1: Convert numbers to strings (template literal)
npm run inspect -- --eval '`${2}`' '`${3}`'
# "2", "3"

# Step 2: Convert string to tuple of character digits
npm run inspect -- --eval 'StrToTuple<"2">' 'StrToTuple<"3">'
# ["2"], ["3"]

# Step 3: Convert digit char to counting tuple
npm run inspect -- --eval 'StrDigitToTuple<"2">' 'StrDigitToTuple<"3">'
# [0, 0], [0, 0, 0]

# Step 4: Spread tuples and get length (the core trick!)
npm run inspect -- --eval '[...StrDigitToTuple<"2">, ...StrDigitToTuple<"3">]["length"]'
# 5

# Step 5: Full Sum
npm run inspect -- --eval 'Sum<2, 3>'
# 5
```

## Demo 2: Two-digit no carry (12 + 34 = 46)

```bash
# String to digit tuple
npm run inspect -- --eval 'StrToTuple<"12">' 'StrToTuple<"34">'
# ["1", "2"], ["3", "4"]

# Add last digits: 2 + 4 = 6 (no carry)
npm run inspect -- --eval 'SumStrDigits<"2", "4", "0">'
# 6

# Add first digits: 1 + 3 = 4 (no carry)
npm run inspect -- --eval 'SumStrDigits<"1", "3", "0">'
# 4

# Full result
npm run inspect -- --eval 'Sum<12, 34>'
# 46
```

## Demo 3: With carry (55 + 67 = 122)

```bash
# String to digit tuples
npm run inspect -- --eval 'StrToTuple<"55">' 'StrToTuple<"67">'
# ["5", "5"], ["6", "7"]

# Step 1: Add last digits: 5 + 7 + 0 (carry) = 12
npm run inspect -- --eval 'SumStrDigits<"5", "7", "0">'
# 12 (not a single digit! needs carry)

# 12 splits into carry "1" and digit "2"

# Step 2: Add first digits with carry: 5 + 6 + 1 = 12
npm run inspect -- --eval 'SumStrDigits<"5", "6", "1">'
# 12 (again needs carry!)

# 12 splits into carry "1" and digit "2"
# Carry "1" becomes the leading digit

# Full Sum showing the result
npm run inspect -- --eval 'Sum<55, 67>'
# 122
```

## Demo 4: Show the tuple counting trick in detail

```bash
# This is HOW we add at the type level - tuple length!
npm run inspect -- --eval 'StrDigitToTuple<"5">'
# [0, 0, 0, 0, 0]

npm run inspect -- --eval 'StrDigitToTuple<"7">'
# [0, 0, 0, 0, 0, 0, 0]

npm run inspect -- --eval '[...StrDigitToTuple<"5">, ...StrDigitToTuple<"7">]'
# [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

npm run inspect -- --eval '[...StrDigitToTuple<"5">, ...StrDigitToTuple<"7">]["length"]'
# 12
```

## Quick Reference - All Steps for 55 + 67

```bash
npm run inspect -- --eval \
  'StrToTuple<"55">' \
  'StrToTuple<"67">' \
  'SumStrDigits<"5", "7", "0">' \
  'SumStrDigits<"5", "6", "1">' \
  'Sum<55, 67>'
```
