/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createFarmerProfile = /* GraphQL */ `
  mutation CreateFarmerProfile(
    $input: CreateFarmerProfileInput!
    $condition: ModelFarmerProfileConditionInput
  ) {
    createFarmerProfile(input: $input, condition: $condition) {
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
export const updateFarmerProfile = /* GraphQL */ `
  mutation UpdateFarmerProfile(
    $input: UpdateFarmerProfileInput!
    $condition: ModelFarmerProfileConditionInput
  ) {
    updateFarmerProfile(input: $input, condition: $condition) {
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
export const deleteFarmerProfile = /* GraphQL */ `
  mutation DeleteFarmerProfile(
    $input: DeleteFarmerProfileInput!
    $condition: ModelFarmerProfileConditionInput
  ) {
    deleteFarmerProfile(input: $input, condition: $condition) {
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
