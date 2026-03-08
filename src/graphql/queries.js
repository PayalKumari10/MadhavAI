/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getFarmerProfile = /* GraphQL */ `
  query GetFarmerProfile($id: ID!) {
    getFarmerProfile(id: $id) {
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
export const listFarmerProfiles = /* GraphQL */ `
  query ListFarmerProfiles(
    $filter: ModelFarmerProfileFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listFarmerProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
