#!/usr/bin/env ruby

def pivot_index(nums)
  total_sum = nums.sum
  left_sum = 0

  nums.each_with_index do |val, i|
    return i if left_sum == total_sum - left_sum - val
    left_sum += val
  end

  -1
end

p pivot_index([1, 4, 6, 3, 2])
