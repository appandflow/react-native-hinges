require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "Hinges"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/AppAndFlow/react-native-hinges.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}", "cpp/**/*.{h,cpp}"
  s.private_header_files = "ios/**/*.h", "cpp/**/*.h"

  worklets_available = system("node", "-e",
    "require.resolve('react-native-worklets/package.json', { paths: [process.argv[1]] })",
    Pod::Config.instance.installation_root.to_s, :out => File::NULL, :err => File::NULL)
  if worklets_available
    s.dependency "RNWorklets"
    s.pod_target_xcconfig = { "GCC_PREPROCESSOR_DEFINITIONS" => "$(inherited) HINGES_WORKLETS_ENABLED=1" }
  end

  install_modules_dependencies(s)
end
