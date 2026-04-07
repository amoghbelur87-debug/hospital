"""
Hospital RL Environment
Reinforcement Learning environment for hospital resource management
"""
import numpy as np
from dataclasses import dataclass
from typing import Tuple, Dict, Any
from enum import Enum


class PatientState(Enum):
    STABLE = "stable"
    CRITICAL = "critical"
    DISCHARGED = "discharged"


@dataclass
class EnvConfig:
    """Environment configuration"""
    max_steps: int = 100
    num_icu_beds: int = 10
    num_general_beds: int = 30
    max_patients: int = 50
    arrival_rate: float = 0.3  # Patients per step
    critical_rate: float = 0.2  # Probability of critical patient
    treatment_duration_mean: int = 20  # Average steps to treat


class HospitalEnv:
    """Hospital RL Environment for resource management"""
    
    def __init__(self, config: EnvConfig = None):
        self.config = config or EnvConfig()
        self.reset()
    
    def reset(self) -> Dict[str, Any]:
        """Reset environment to initial state"""
        self.step_count = 0
        self.patients = []
        self.total_patients_admitted = 0
        self.total_patients_discharged = 0
        self.total_deaths = 0
        self.icu_beds_used = 0
        self.general_beds_used = 0
        self.wait_queue = []
        self.episode_reward = 0.0
        
        return self._get_state()
    
    def _get_state(self) -> Dict[str, Any]:
        """Get current environment state"""
        return {
            "step": self.step_count,
            "total_patients": len(self.patients),
            "icu_beds_used": self.icu_beds_used,
            "icu_beds_available": self.config.num_icu_beds - self.icu_beds_used,
            "general_beds_used": self.general_beds_used,
            "general_beds_available": self.config.num_general_beds - self.general_beds_used,
            "wait_queue_length": len(self.wait_queue),
            "total_admitted": self.total_patients_admitted,
            "total_discharged": self.total_patients_discharged,
            "total_deaths": self.total_deaths,
            "patients": [
                {
                    "id": p["id"],
                    "status": p["status"],
                    "bed_type": p["bed_type"],
                    "time_in_hospital": self.step_count - p["arrival_step"],
                }
                for p in self.patients
            ]
        }
    
    def step(self, action: int) -> Tuple[Dict[str, Any], float, bool, Dict]:
        """
        Execute one step in the environment
        
        action: int - Which patient to discharge (or -1 to discharge none)
        Returns: (state, reward, done, info)
        """
        self.step_count += 1
        reward = 0.0
        
        # Generate new patient arrivals
        if np.random.rand() < self.config.arrival_rate:
            is_critical = np.random.rand() < self.config.critical_rate
            self._add_patient(is_critical)
        
        # Try to assign patients from queue to beds
        self._assign_from_queue()
        
        # Process discharge action
        if action >= 0 and action < len(self.patients):
            discharged = self.patients[action]
            if discharged["status"] != "critical":  # Can't discharge critical patients
                reward += 10.0  # Reward for successful discharge
                self._discharge_patient(action)
        
        # Update patient conditions
        self._update_patients()
        
        # Calculate reward components
        reward += self._calculate_step_reward()
        self.episode_reward += reward
        
        done = self.step_count >= self.config.max_steps
        
        return self._get_state(), reward, done, {"episode_reward": self.episode_reward if done else None}
    
    def _add_patient(self, is_critical: bool):
        """Add new patient to the system"""
        if len(self.patients) >= self.config.max_patients:
            return
        
        patient = {
            "id": f"P{self.total_patients_admitted}",
            "arrival_step": self.step_count,
            "status": PatientState.CRITICAL.value if is_critical else PatientState.STABLE.value,
            "bed_type": "icu" if is_critical else "general",
            "time_in_bed": 0,
            "duration_needed": np.random.normal(
                self.config.treatment_duration_mean,
                self.config.treatment_duration_mean // 3
            ),
        }
        
        self.total_patients_admitted += 1
        self.wait_queue.append(patient)
    
    def _assign_from_queue(self):
        """Assign waiting patients to available beds"""
        while self.wait_queue:
            patient = self.wait_queue[0]
            bed_type = patient["bed_type"]
            
            if bed_type == "icu" and self.icu_beds_used < self.config.num_icu_beds:
                self.wait_queue.pop(0)
                patient["assigned_bed"] = "icu"
                self.patients.append(patient)
                self.icu_beds_used += 1
            elif bed_type == "general" and self.general_beds_used < self.config.num_general_beds:
                self.wait_queue.pop(0)
                patient["assigned_bed"] = "general"
                self.patients.append(patient)
                self.general_beds_used += 1
            else:
                break
    
    def _update_patients(self):
        """Update patient status and conditions"""
        for patient in self.patients:
            patient["time_in_bed"] += 1
            
            # Discharge if treatment complete
            if patient["time_in_bed"] >= patient["duration_needed"]:
                idx = self.patients.index(patient)
                self._discharge_patient(idx)
            # Random critical event (small chance)
            elif patient["status"] == PatientState.STABLE.value and np.random.rand() < 0.05:
                patient["status"] = PatientState.CRITICAL.value
    
    def _discharge_patient(self, idx: int):
        """Remove patient from hospital (either discharged or died)"""
        if idx >= len(self.patients):
            return
        
        patient = self.patients.pop(idx)
        is_icu = patient.get("assigned_bed") == "icu"
        
        if is_icu:
            self.icu_beds_used -= 1
        else:
            self.general_beds_used -= 1
        
        if patient["status"] == PatientState.CRITICAL.value:
            self.total_deaths += 1
        else:
            self.total_patients_discharged += 1
    
    def _calculate_step_reward(self) -> float:
        """Calculate reward for this step"""
        reward = 0.0
        
        # Reward for having available beds (efficiency)
        reward += (self.config.num_icu_beds - self.icu_beds_used) * 0.1
        
        # Penalty for patients in queue (waiting is bad)
        reward -= len(self.wait_queue) * 1.0
        
        # Penalty for critical patients staying in hospital (mortality risk)
        critical_count = sum(1 for p in self.patients if p["status"] == PatientState.CRITICAL.value)
        reward -= critical_count * 0.5
        
        # Reward for maintaining stability
        reward += 0.5
        
        return reward
    
    def render(self):
        """Print current state"""
        state = self._get_state()
        print(f"Step {state['step']}")
        print(f"Beds: ICU {state['icu_beds_used']}/{self.config.num_icu_beds} | "
              f"General {state['general_beds_used']}/{self.config.num_general_beds}")
        print(f"Queue: {state['wait_queue_length']} | "
              f"Admitted: {state['total_admitted']} | "
              f"Discharged: {state['total_discharged']} | "
              f"Deaths: {state['total_deaths']}")
        print(f"Episode Reward: {self.episode_reward:.2f}\n")


if __name__ == "__main__":
    # Test the environment
    env = HospitalEnv()
    state = env.reset()
    
    for _ in range(5):
        env.render()
        action = np.random.randint(-1, len(state["patients"]))
        state, reward, done, info = env.step(action)
        
        if done:
            break
