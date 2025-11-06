// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GameScore {
    event ScoreRecorded(
        address indexed submitterAddress,
        string winner,
        string loser,
        string score,
        uint256 duration,
        uint256 timestamp
    );

    function recordScore(
        string memory _winner,
        string memory _loser,
        string memory _score,
        uint256 _duration
    ) public {
        emit ScoreRecorded(
            msg.sender,
            _winner,
            _loser,
            _score,
            _duration,
            block.timestamp
        );
    }
}


