import Schedule, { ISchedule } from '../models/Schedule';
import dbConnect from '../db/connection';

class ScheduleService {
  // Create a new schedule
  static async createSchedule(scheduleData: Partial<ISchedule>): Promise<ISchedule> {
    await dbConnect();
    
    // If this is set as default, unset any existing default for this user
    if (scheduleData.isDefault && scheduleData.userId) {
      await Schedule.updateMany(
        { userId: scheduleData.userId, isDefault: true },
        { $set: { isDefault: false } }
      );
    }
    
    const schedule = new Schedule(scheduleData);
    return await schedule.save();
  }

  // Get a schedule by ID
  static async getScheduleById(id: string, userId: string): Promise<ISchedule | null> {
    await dbConnect();
    return await Schedule.findOne({ _id: id, userId });
  }

  // Get all schedules for a user
  static async getUserSchedules(userId: string): Promise<ISchedule[]> {
    await dbConnect();
    return await Schedule.find({ userId }).sort({ isDefault: -1, updatedAt: -1 });
  }

  // Get user's default schedule
  static async getDefaultSchedule(userId: string): Promise<ISchedule | null> {
    await dbConnect();
    return await Schedule.findOne({ userId, isDefault: true });
  }

  // Update a schedule
  static async updateSchedule(
    id: string, 
    userId: string, 
    updateData: Partial<ISchedule>
  ): Promise<ISchedule | null> {
    await dbConnect();
    
    // If this is set as default, unset any existing default for this user
    if (updateData.isDefault) {
      await Schedule.updateMany(
        { userId, isDefault: true, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );
    }
    
    return await Schedule.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  // Delete a schedule
  static async deleteSchedule(id: string, userId: string): Promise<boolean> {
    await dbConnect();
    const result = await Schedule.deleteOne({ _id: id, userId });
    return result.deletedCount > 0;
  }

  // Save a generated schedule
  static async saveGeneratedSchedule(
    userId: string,
    events: any[],
    preferences: any,
    title: string = 'Generated Schedule'
  ): Promise<ISchedule> {
    await dbConnect();
    
    // Create the schedule data
    const scheduleData = {
      userId,
      title,
      events,
      preferences,
      isDefault: true // Set as default
    };
    
    return await this.createSchedule(scheduleData);
  }
}

export default ScheduleService;
