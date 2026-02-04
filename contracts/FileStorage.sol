// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FileStorage {
    struct File {
        string ipfsHash;
        address owner;
        uint256 timestamp;
        bool exists;
    }

    mapping(uint256 => File) public files;
    mapping(uint256 => mapping(address => bool)) public fileAccess;
    mapping(string => uint256) public hashToFileId;
    
    uint256 public fileCount;

    event FileAdded(uint256 indexed fileId, string ipfsHash, address indexed owner);
    event AccessGranted(uint256 indexed fileId, address indexed wallet);
    event AccessRevoked(uint256 indexed fileId, address indexed wallet);

    modifier onlyFileOwner(uint256 _fileId) {
        require(files[_fileId].owner == msg.sender, "Not file owner");
        _;
    }

    modifier fileExists(uint256 _fileId) {
        require(files[_fileId].exists, "File does not exist");
        _;
    }

    function addFile(string memory _ipfsHash) external returns (uint256) {
        require(bytes(_ipfsHash).length > 0, "Hash cannot be empty");
        require(hashToFileId[_ipfsHash] == 0, "File already registered");

        fileCount++;
        files[fileCount] = File({
            ipfsHash: _ipfsHash,
            owner: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        
        hashToFileId[_ipfsHash] = fileCount;
        fileAccess[fileCount][msg.sender] = true;

        emit FileAdded(fileCount, _ipfsHash, msg.sender);
        return fileCount;
    }

    function grantAccess(uint256 _fileId, address _wallet) external 
        onlyFileOwner(_fileId) 
        fileExists(_fileId) 
    {
        require(_wallet != address(0), "Invalid address");
        fileAccess[_fileId][_wallet] = true;
        emit AccessGranted(_fileId, _wallet);
    }

    function revokeAccess(uint256 _fileId, address _wallet) external 
        onlyFileOwner(_fileId) 
        fileExists(_fileId) 
    {
        require(_wallet != msg.sender, "Cannot revoke own access");
        fileAccess[_fileId][_wallet] = false;
        emit AccessRevoked(_fileId, _wallet);
    }

    function verifyHash(string memory _ipfsHash) external view returns (bool exists, address owner, uint256 timestamp) {
        uint256 fileId = hashToFileId[_ipfsHash];
        if (fileId == 0 || !files[fileId].exists) {
            return (false, address(0), 0);
        }
        File memory file = files[fileId];
        return (true, file.owner, file.timestamp);
    }

    function hasAccess(uint256 _fileId, address _wallet) external view returns (bool) {
        return fileAccess[_fileId][_wallet];
    }

    function getFile(uint256 _fileId) external view fileExists(_fileId) returns (
        string memory ipfsHash,
        address owner,
        uint256 timestamp
    ) {
        File memory file = files[_fileId];
        return (file.ipfsHash, file.owner, file.timestamp);
    }
}
