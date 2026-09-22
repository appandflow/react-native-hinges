#pragma once

#include <functional>
#include <memory>
#include <string>
#include <vector>

namespace facebook::jsi {
class Runtime;
}

namespace hinges {

struct HingeReading {
  std::string status;
  double angle;
  bool hasAngle;
};

class WorkletsBridge : public std::enable_shared_from_this<WorkletsBridge> {
 public:
  WorkletsBridge();
  ~WorkletsBridge();
  void install(facebook::jsi::Runtime &runtime, std::function<void(int)> start, std::function<void(int)> stop);
  void publish(int rootTag, const std::vector<HingeReading> &hinges);
  void invalidate();

 private:
  struct State;
  std::unique_ptr<State> state_;
};

}
