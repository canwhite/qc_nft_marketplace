// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


library Counters {
    // Define a Counter struct to hold the current count
    struct Counter {
        //unit值默认是0
        uint256 _value; // The current counter value
    }
    // get the current value of the counter
    function current(Counter storage counter ) internal view returns(uint256){
        return counter._value;
    }
    //increment the counter by 1
    function  increment(Counter storage counter) internal {
        counter._value +=1;
    }

    //decrement the counter by 1
    function decrement(Counter storage counter) internal{
        uint256 value = counter._value;
        require(value > 0, "Counter: decrement underflow");
        counter._value = value -1;
    }

    //reset the counter to 0
    function reset(Counter storage counter) internal {
        counter._value = 0;
    }

}