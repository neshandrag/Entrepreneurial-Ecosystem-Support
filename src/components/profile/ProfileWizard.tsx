import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProgressBar from '../ui/ProgressBar';
import PersonalInfo from './steps/PersonalInfo';
import EnterpriseInfo from './steps/EnterpriseInfo';
import IncubationDetails from './steps/IncubationDetails';
import Documentation from './steps/Documentation';
import PitchDeckTraction from './steps/PitchDeckTraction';
import FundingInfo from './steps/FundingInfo';
import { Profile, FrontendStartupData } from '../../types'; // Import FrontendStartupData
import { Building2 } from 'lucide-react';
import { startupsApi } from '../../services/startupsApi'; // Import startupsApi

const ProfileWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<Partial<Profile>>({});
  const [startupId, setStartupId] = useState<string | undefined>(undefined);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const totalSteps = 6;

  const updateProfileData = (stepData: Partial<Profile>) => {
    setProfileData(prev => ({ ...prev, ...stepData }));
  };

  const nextStep = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // This is the last step, submit the data to the backend
      if (!user) {
        console.error("User not logged in, cannot create startup profile.");
        // Optionally, redirect to login or show an error
        return;
      }

      try {
        const startupPayload: FrontendStartupData = {
          name: profileData.startupName || '',
          founder: profileData.founderName || '',
          sector: profileData.sector || '',
          type: profileData.applicationType || 'innovation',
          email: profileData.email || '',
          description: profileData.description || '',
          website: profileData.website || '',
          linkedinProfile: profileData.linkedinProfile || '',
          teamSize: profileData.teamSize || undefined,
          foundedYear: profileData.foundedYear || undefined,
          location: profileData.location || '',
          trlLevel: profileData.trlLevel || 1, // Default TRL to 1 if not set
          coFounderNames: profileData.coFounderNames || [],
          applicationStatus: 'submitted', // Set initial application status
          
          // Incubation Details
          previouslyIncubated: profileData.previouslyIncubated || false,
          incubatorName: profileData.incubatorName || undefined,
          incubatorLocation: profileData.incubatorLocation || undefined,
          incubationDuration: profileData.incubationDuration || undefined,
          incubatorType: profileData.incubatorType || undefined,
          incubationMode: profileData.incubationMode || undefined,
          supportsReceived: profileData.supportsReceived || undefined,

          // Documentation (these fields would likely hold URLs/references after file uploads)
          aadhaarDoc: profileData.aadhaarDoc || undefined,
          incorporationCert: profileData.incorporationCert || undefined,
          msmeCert: profileData.msmeCert || undefined,
          dpiitCert: profileData.dpiitCert || undefined,
          mouPartnership: profileData.mouPartnership || undefined,

          // Pitch Deck & Traction
          businessDocuments: profileData.businessDocuments || undefined,
          tractionDetails: profileData.tractionDetails || undefined,
          balanceSheet: profileData.balanceSheet || undefined,

          // Funding Information
          fundingStage: profileData.fundingStage || undefined,
          alreadyFunded: profileData.alreadyFunded || false,
          fundingAmount: profileData.fundingAmount || undefined,
          fundingSource: profileData.fundingSource || undefined,
          fundingDate: profileData.fundingDate || undefined,
        };

        // Create or Update Startup Profile
        let createdStartup;
        if (startupId) {
          createdStartup = await startupsApi.updateStartupProfile(startupId, startupPayload);
        } else {
          createdStartup = await startupsApi.createStartupProfile(startupPayload);
        }

        setStartupId(createdStartup.id); // Save the new startup ID
        
        // Update user context to mark profile as complete and associate startupId
        updateUser({ profileComplete: true, startupId: createdStartup.id });
        navigate('/dashboard');

      } catch (error) {
        console.error("Error saving startup profile:", error);
        // Display error message to the user
        alert(`Failed to save profile: ${(error as Error).message}`);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfo data={profileData} updateData={updateProfileData} onNext={nextStep} />;
      case 2:
        return <EnterpriseInfo data={profileData} updateData={updateProfileData} onNext={nextStep} onPrev={prevStep} />;
      case 3:
        return <IncubationDetails data={profileData} updateData={updateProfileData} onNext={nextStep} onPrev={prevStep} />;
      case 4:
        return <Documentation data={profileData} updateData={updateProfileData} onNext={nextStep} onPrev={prevStep} />;
      case 5:
        return <PitchDeckTraction data={profileData} updateData={updateProfileData} onNext={nextStep} onPrev={prevStep} />;
      case 6:
        return <FundingInfo data={profileData} updateData={updateProfileData} onNext={nextStep} onPrev={prevStep} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Building2 className="h-8 w-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">Profile Setup</h1>
          </div>
          <p className="text-gray-300">Complete your profile to access the dashboard</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar current={currentStep} total={totalSteps} />
        </div>

        {/* Step Content */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default ProfileWizard; 