import { ethers } from 'ethers'

// Contract ABI - only the functions we need
const CONTRACT_ABI = [
    "function addFile(string memory _ipfsHash) external returns (uint256)",
    "function grantAccess(uint256 _fileId, address _wallet) external",
    "function revokeAccess(uint256 _fileId, address _wallet) external",
    "function verifyHash(string memory _ipfsHash) external view returns (bool exists, address owner, uint256 timestamp)",
    "function hasAccess(uint256 _fileId, address _wallet) external view returns (bool)",
    "function getFile(uint256 _fileId) external view returns (string memory ipfsHash, address owner, uint256 timestamp)",
    "function fileCount() external view returns (uint256)"
]

// Contract address - update after deployment
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'

export function getContract(signerOrProvider) {
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider)
}

export { CONTRACT_ADDRESS, CONTRACT_ABI }
