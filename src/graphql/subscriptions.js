/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateFarmerProfile = /* GraphQL */ `
  subscription OnCreateFarmerProfile(
    $filter: ModelSubscriptionFarmerProfileFilterInput
    $owner: String
  ) {
    onCreateFarmerProfile(filter: $filter, owner: $owner) {
      id
      owner
      fullName
      state
      district
      villageTown
      pincode
      farmSizeAcres
      soilType
      primaryCrops
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateFarmerProfile = /* GraphQL */ `
  subscription OnUpdateFarmerProfile(
    $filter: ModelSubscriptionFarmerProfileFilterInput
    $owner: String
  ) {
    onUpdateFarmerProfile(filter: $filter, owner: $owner) {
      id
      owner
      fullName
      state
      district
      villageTown
      pincode
      farmSizeAcres
      soilType
      primaryCrops
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteFarmerProfile = /* GraphQL */ `
  subscription OnDeleteFarmerProfile(
    $filter: ModelSubscriptionFarmerProfileFilterInput
    $owner: String
  ) {
    onDeleteFarmerProfile(filter: $filter, owner: $owner) {
      id
      owner
      fullName
      state
      district
      villageTown
      pincode
      farmSizeAcres
      soilType
      primaryCrops
      createdAt
      updatedAt
      __typename
    }
  }
`;
