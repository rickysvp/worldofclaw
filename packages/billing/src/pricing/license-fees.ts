export const getFacilityLicenseFee = (license_count: number, included_licenses: number): number => {
  const billable = Math.max(0, license_count - included_licenses);
  return billable * 150;
};
